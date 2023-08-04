import { Query } from "@datorama/akita";

import {
  HistoricalEvent,
  forceDirectedGraph,
  rawNetworkToAdjMat,
} from "react-konva-components/src";
import { Observable, combineLatest, map } from "rxjs";
import type {
  AdjacencyMatrix,
  HexString,
  RawNetwork,
  RenderableNetworkNode,
} from "type-library/src";
import { periodIsSegmentGuard } from "../Timeline";
import type {
  LineSegment,
  PeriodOrSingleton,
  RenderableEvent,
  SpaceConvertingFunction,
  TimeSpace,
  TimelineSpace,
} from "../types";
import { DataState, DataStore, dataStore } from "./data.store";

const getRandomColor = (): HexString => {
  // return "#FFFFFF";

  const channelSize = 16;
  const charCode = new Array(6)
    .fill(0)
    .map(() => Math.round(Math.random() * channelSize).toString(16))
    .reduce((prev, curr) => prev + curr);

  return `#${charCode}`;
};

const timeObjAAfterTimeObjB = (
  timeA: PeriodOrSingleton<TimeSpace>,
  timeB: PeriodOrSingleton<TimeSpace>,

  key: keyof LineSegment
): boolean => {
  const aIsSegment = periodIsSegmentGuard(timeA);
  const bIsSegment = periodIsSegmentGuard(timeB);

  if (aIsSegment && bIsSegment) {
    return timeA[key] >= timeB[key];
  }
  if (aIsSegment && !bIsSegment) {
    return timeA[key] >= timeB;
  }
  if (!aIsSegment && bIsSegment) {
    return timeA >= timeB[key];
  }
  if (!aIsSegment && !bIsSegment) {
    return timeA >= timeB;
  }
  return false;
};
export class DataQuery extends Query<DataState> {
  public static sortEvents = (
    events: HistoricalEvent[],
    sortKey: keyof LineSegment
  ) => {
    console.log("TODO", sortKey);
    return [...events].sort((eventA, eventB) => {
      return timeObjAAfterTimeObjB(eventA.eventTime, eventB.eventTime, "start")
        ? 1
        : -1;
    });
  };

  // TODO is timeline len supposed to be number of years?
  public static buildEventPositioner = (
    earliestDate: TimeSpace,
    latestDate: TimeSpace
  ) => {
    const timelinePositionForEvent: SpaceConvertingFunction<
      TimeSpace,
      TimelineSpace
    > = (val) => {
      const timelineLen = latestDate - earliestDate;
      return ((val - earliestDate) / timelineLen) as TimelineSpace;
    };

    const eventPositioner = ({ eventTime }: HistoricalEvent): TimelineSpace => {
      const isSegment = periodIsSegmentGuard(eventTime);
      if (isSegment) {
        // for time period events just position tooltip in the middle
        return ((timelinePositionForEvent(eventTime.end) +
          timelinePositionForEvent(eventTime.start)) /
          2) as TimelineSpace;
      }

      return timelinePositionForEvent(eventTime);
    };
    return eventPositioner;
  };
  constructor(protected store: DataStore) {
    super(store);
  }

  private unfilteredEvents = this.select("events");

  public networkNodes = this.select("networkNodes");
  public networkNodesArray = this.networkNodes.pipe(
    map((nodes) => Object.values(nodes))
  );
  public networkEdges = this.select("networkEdges");

  public rawNetwork: Observable<RawNetwork> = combineLatest([
    this.networkNodesArray,
    this.networkEdges,
  ]).pipe(
    map(([nodes, edges]) => {
      return { nodes, edges };
    })
  );

  public adjMat: Observable<AdjacencyMatrix> = this.rawNetwork.pipe(
    map((network) => rawNetworkToAdjMat(network))
  );

  public renderableNetworkNodes: Observable<RenderableNetworkNode[]> =
    combineLatest([this.networkNodesArray, this.adjMat]).pipe(
      map(([nodes, adjMat]) => {
        //
        const placements = forceDirectedGraph({ G: adjMat, H: 100 });
        return nodes.map((node, ii) => {
          return {
            ...node,
            renderedProps: {
              position: { ...placements[ii] },
              color: getRandomColor(),
            },
          };
        });
      })
    );

  // public renderableEdges: Observable<RenderableNetworkEdge[]> = combineLatest([
  //   this.renderableNetworkNodes,
  //   this.networkEdges,
  //   this.adjMat,
  // ]).pipe(
  //   map(([nodes, edges]) => {
  //     return edges.map((edge) => {
  //       return {
  //         ...edge,
  //         renderedProps: {
  //           originPosition: nodes[edge.origin].renderedProps.position,
  //           targetPosition: nodes[edge.target].renderedProps.position,
  //         },
  //       };
  //     });
  //   })
  // );

  public initialDateFilter = this.select("initialDateFilter");
  public finalDateFilter = this.select("finalDateFilter");

  public events = combineLatest([
    this.unfilteredEvents,
    this.initialDateFilter,
    this.finalDateFilter,
  ]).pipe(
    map(([events, initialDateFilter, finalDateFilter]) => {
      if (!(initialDateFilter !== null || finalDateFilter !== null)) {
        return events;
      }

      const eventsAboveInitial = !initialDateFilter
        ? events
        : events.filter((event) => {
            return timeObjAAfterTimeObjB(
              event.eventTime,
              initialDateFilter,
              "start"
            );
          });

      const eventsBelowFinal = !finalDateFilter
        ? eventsAboveInitial
        : eventsAboveInitial.filter((event) => {
            return timeObjAAfterTimeObjB(
              finalDateFilter,
              event.eventTime,
              "end"
            );
          });

      return eventsBelowFinal;
    })
  );

  public numberEventsAfterFilter = this.events.pipe(
    map((events) => events.length)
  );

  public eventsSortedByStartDate = this.events.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "start");
    })
  );

  public eventsSortedByEndDate = this.events.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "end");
    })
  );

  public unfilteredEventsSortedByStartDate = this.unfilteredEvents.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "start");
    })
  );

  public unfilteredEventsSortedByEndDate = this.unfilteredEvents.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "end");
    })
  );

  public earliestEventStart = this.eventsSortedByStartDate.pipe(
    map((events) => {
      if (events.length === 0) {
        return null;
      }
      const [{ eventTime }] = events;
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.start : eventTime;
    })
  );

  public latestEventEnd = this.eventsSortedByEndDate.pipe(
    map((events) => {
      if (events.length === 0) {
        return null;
      }
      const { eventTime } = events[events.length - 1];
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.end : eventTime;
    })
  );

  public initialDateFilterWithFallback = combineLatest([
    this.initialDateFilter,
    this.earliestEventStart,
  ]).pipe(map(([date, fallback]) => (date ? date : fallback)));

  public finalDateFilterWithFallback = combineLatest([
    this.finalDateFilter,
    this.latestEventEnd,
  ]).pipe(map(([date, fallback]) => (date ? date : fallback)));

  private rawCountries = this.select("countries");
  private countriesQCodes = this.select("countriesQCodes");
  private existingCountries = this.rawCountries.pipe(
    map((countries) => {
      return countries.filter((country) => country.stateEnd === undefined);
    })
  );

  public countries = combineLatest([
    this.existingCountries,
    this.countriesQCodes,
  ]).pipe(
    map(([countries, countriesQCodes]) => {
      return countries.map((country) => ({
        ...country,
        item: {
          ...country.item,
          valueString: countriesQCodes[country.item.value],
        },
      }));
    })
  );
  public countriesInSameAlliance = [];
  public unfilteredEarliestEventStart =
    this.unfilteredEventsSortedByStartDate.pipe(
      map(([{ eventTime }]) => {
        const isSegment = periodIsSegmentGuard(eventTime);
        return isSegment ? eventTime.start : eventTime;
      })
    );

  public unfilteredLatestEventEnd = this.unfilteredEventsSortedByEndDate.pipe(
    map((events) => {
      if (events.length === 0) {
        return null;
      }
      const { eventTime } = events[events.length - 1];
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.end : eventTime;
    })
  );

  // derived observables
  public renderReadyEvents: Observable<RenderableEvent[]> = combineLatest([
    this.events,
    this.initialDateFilterWithFallback,
    this.finalDateFilterWithFallback,
  ]).pipe(
    map(([events, earliest, latest]) => {
      if (events.length === 0 || !earliest || !latest) {
        return [];
      }
      const positioner = DataQuery.buildEventPositioner(earliest, latest);
      return events.map((event) => {
        return {
          ...event,
          renderedProps: {
            color: getRandomColor(),
            position: positioner(event),
          },
        };
      });
    })
  );
}
export const dataQuery = new DataQuery(dataStore);
