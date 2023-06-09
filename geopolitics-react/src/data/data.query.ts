import { Query } from "@datorama/akita";
import { combineLatest, map, Observable } from "rxjs";
import { forceDirectedGraph } from "../layoutNetwork";
import {
  periodIsSegmentGuard,
  HexStr,
  HistoricalEvent,
  LineSegment,
  RenderableEvent,
  SpaceConvertingFunction,
  TimelineSpace,
  TimeSpace,
  PeriodOrSingleton,
  RenderableNetworkEdge,
  RawNetwork,
  AdjacencyMatrix,
  RenderableNetworkNode,
  Matrix,
} from "../types";
import { DataState, DataStore, dataStore } from "./data.store";

const createLoL = (dim: number): Matrix<0> =>
  [...Array.from({ length: dim }).keys()].map(
    () => [...Array.from({ length: dim }).keys()].fill(0) as 0[]
  );
const rawNetworkToAdjMat = (network: RawNetwork): AdjacencyMatrix => {
  const numNodes = network.nodes.length;

  const adjMat: AdjacencyMatrix = createLoL(numNodes);

  network.nodes.forEach(({ id }, ii) => {
    const edgesStartingFromThisNode = network.edges
      .map((edge, ii) => {
        return { ...edge, index: ii };
      })
      .filter((edge) => {
        return edge.origin === id;
      });
    const slice = adjMat[ii];
    edgesStartingFromThisNode.forEach((edge) => {
      slice[edge.index] = 1;
    });
  });
  console.log("TEST123-adjMat", adjMat);
  return adjMat;
};
// const adjMatToRawNetwork = (adjMat: AdjacencyMatrix): RawNetwork => {
//   const numNodes = adjMat.length;
//   const nodes = new Array(numNodes).keys();
//   const edges = [];
//   return { nodes, edges };
// };

const getRandomColor = (): HexStr => {
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

  public renderableEdges: Observable<RenderableNetworkEdge[]> = combineLatest([
    this.renderableNetworkNodes,
    this.networkEdges,
    this.adjMat,
  ]).pipe(
    map(([nodes, edges]) => {
      return edges.map((edge) => {
        return {
          ...edge,
          renderedProps: {
            originPosition: nodes[edge.origin].renderedProps.position,
            targetPosition: nodes[edge.target].renderedProps.position,
          },
        };
      });
    })
  );

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
