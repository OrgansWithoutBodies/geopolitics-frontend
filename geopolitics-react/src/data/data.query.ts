import { Query } from "@datorama/akita";

import {
  CountryNameLookup,
  GeoJsonGeometryGeneric,
  HistoricalEvent,
  adjMatToRawNetwork,
} from "react-konva-components/src";
import { Observable, combineLatest, map } from "rxjs";
import { NetworkNode, RawNetwork, RenderableNetworkEdge } from "type-library";
import type {
  HexString,
  ObjectAdjacencyMatrix,
  RenderableNetworkNode,
} from "type-library/src";
import { periodIsSegmentGuard } from "../Timeline";
import { offsetDate } from "../timeTools";
import type {
  BrandedNumber,
  EventID,
  LineSegment,
  PeriodOrSingleton,
  RenderableEvent,
  SpaceConvertingFunction,
  TimeSpace,
  TimelineSpace,
} from "../types";
import {
  CountryID,
  DataState,
  DataStore,
  QCode,
  dataStore,
  numericalQCode,
} from "./data.store";

type BlocID = BrandedNumber<"BlocID">;

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

  private filterYears = this.select("filterYears");
  private networkNodeRenderProps = this.select("networkNodeRenderProps");
  private unfilteredEvents = this.select("events");

  // public networkNodes = this.select("networkNodes");
  // public adjMat: Observable<AdjacencyMatrix> = this.rawNetwork.pipe(
  //   map((network) => rawNetworkToAdjMat(network))
  // );

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
      return countries.filter((country) => {
        return country.stateEnd !== undefined;
      });
    })
  );

  // private rawWars = this.select("wars");
  // public tradeBlocs = this.select("tradeBloc");
  private countryOutlines = this.select("countriesOutlines");

  // private wars;
  public countries: Observable<
    {
      geometry: GeoJsonGeometryGeneric;
      key: CountryID;
    }[]
  > = combineLatest([this.existingCountries, this.countryOutlines]).pipe(
    map(([countries, countryOutlines]) => {
      return countries.map((country) => ({
        key: numericalQCode(country) as CountryID,
        // TODO no any
        geometry: countryOutlines[
          country.item.value
        ] as any as GeoJsonGeometryGeneric,
      }));
    })
  );
  public selectedCountry: Observable<CountryID | null> =
    this.select("selectedCountry");
  // 0800-01-01T00:00:00Z
  public countriesSortedByStart: typeof this.existingCountries = combineLatest([
    this.existingCountries,
  ]).pipe(
    map(([countries]) => {
      return [...countries].sort((a, b) =>
        new Date(a.stateStart.value) > new Date(b.stateStart.value) ? 1 : -1
      );
    })
  );
  public countryStartEndpoints: Observable<{
    start: TimeSpace;
    end: TimeSpace;
  }> = combineLatest([this.countriesSortedByStart]).pipe(
    map(([sortedCountries]) => {
      const earliestEvent = new Date(
        sortedCountries[0].stateStart.value
      ).getTime() as TimeSpace;
      const latestEvent = new Date(
        sortedCountries[sortedCountries.length - 1].stateStart.value
      ).getTime() as TimeSpace;

      return { start: earliestEvent, end: latestEvent };
    })
  );

  public filterYearsNullSafe: Observable<{
    start: TimeSpace;
    end: TimeSpace;
  }> = combineLatest([this.countryStartEndpoints, this.filterYears]).pipe(
    map(([countryStartEndpoints, filterYears]) => {
      const safeStart = (
        filterYears.start !== null
          ? filterYears.start
          : countryStartEndpoints.start
      ) as TimeSpace;
      const safeEnd = (
        filterYears.end !== null ? filterYears.end : countryStartEndpoints.end
      ) as TimeSpace;
      return { start: safeStart, end: safeEnd };
    })
  );

  public filterYearsRenderReady: Observable<{ start: number; end: number }> =
    this.filterYearsNullSafe.pipe(
      map(({ start, end }) => {
        return { start: offsetDate(start), end: offsetDate(end) };
      })
    );

  public countryStarts: Observable<RenderableEvent[]> = combineLatest([
    this.countriesSortedByStart,
    this.filterYearsNullSafe,
    this.countriesQCodes,
    this.selectedCountry,
  ]).pipe(
    map(([countries, filterYearsNullSafe, qCodes, selectedCountry]) => {
      const { start, end } = filterYearsNullSafe;
      const sortedCountries = [...countries].sort((a, b) =>
        new Date(a.stateStart.value) > new Date(b.stateStart.value) ? 1 : -1
      );
      const filteredCountries = sortedCountries.filter((country) => {
        const eventTime = new Date(
          country.stateStart.value
        ).getTime() as TimeSpace;
        return eventTime >= start && eventTime <= end;
      });
      return filteredCountries.map((country) => {
        const startDate = country.stateStart.value;
        const eventTime = new Date(startDate).getTime() as TimeSpace;
        const positioner = DataQuery.buildEventPositioner(start, end);
        const genericProps = {
          id: numericalQCode(country) as EventID,
          eventName: `Beginning of ${qCodes[country.item.value]}`,
          eventInfo: "",
          eventTime,
        };
        return {
          ...genericProps,
          renderedProps: {
            // TODO no as any, same as overloading country & event id as same
            color:
              (selectedCountry as any) === (genericProps.id as any)
                ? "#FFFF00"
                : "#FF0000",
            position: positioner(genericProps),
          },
        };
      });
    })
  );
  public countryToName: Observable<CountryNameLookup<number>> = combineLatest([
    this.existingCountries,
    this.countriesQCodes,
  ]).pipe(
    map(([countries, countriesQCodes]) => {
      return Object.fromEntries(
        countries.map((country) => {
          return [numericalQCode(country), countriesQCodes[country.item.value]];
        })
      );
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

  // NETWORK STUFF

  public tradeBlocs = this.select("tradeBlocs");
  public blocMemberships: Observable<
    Record<QCode<BlocID>, QCode<CountryID>[]>
  > = this.tradeBlocs.pipe(
    map((blocs) => {
      const uniqueBlocs = [
        ...new Set(blocs.map((entry) => [entry.item.value, []])),
      ];
      const blocMemberships: Record<
        QCode<BlocID>,
        QCode<CountryID>[]
      > = Object.fromEntries(uniqueBlocs);
      blocs.forEach((bloc) => {
        blocMemberships[bloc.item.value as QCode<BlocID>].push(
          bloc.memberState.value as QCode<CountryID>
        );
      });
      return blocMemberships;
    })
  );
  public countriesInSameTradeBloc: Observable<
    ObjectAdjacencyMatrix<CountryID, 0 | 1>
  > = combineLatest([this.blocMemberships]).pipe(
    map(([blocMemberships]) => {
      const groupedBlocs = Object.values(blocMemberships);
      const uniqueEntitiesInTradeBlocs = [...new Set(groupedBlocs.flat())];
      // const countryIndexFromQCodeLookup = Object.fromEntries(
      //   uniqueEntitiesInTradeBlocs.map((entity, ii) => {
      //     return [entity, ii] as [QCode<CountryID>, number];
      //   })
      // );
      const QCodeFromCountryIndexLookup = Object.fromEntries(
        uniqueEntitiesInTradeBlocs.map((entity, ii) => {
          return [ii, entity] as [number, QCode<CountryID>];
        })
      );
      const tradeBlocMatrix: ObjectAdjacencyMatrix<CountryID, 0 | 1> =
        Object.fromEntries(
          new Array(uniqueEntitiesInTradeBlocs.length).fill(0).map((_, ii) => [
            numericalQCode({
              item: { value: QCodeFromCountryIndexLookup[ii] },
            }),
            Object.fromEntries(
              new Array(uniqueEntitiesInTradeBlocs.length)
                .fill(0)
                .map((_, jj) => [
                  numericalQCode({
                    item: { value: QCodeFromCountryIndexLookup[jj] },
                  }),
                  0,
                ])
            ),
          ])
        );
      groupedBlocs.forEach((entryList) => {
        entryList.forEach((entry, ii) => {
          entryList.forEach((otherEntry, jj) => {
            if (jj > ii) {
              tradeBlocMatrix[
                numericalQCode({ item: { value: entry } }) as CountryID
              ][
                numericalQCode({ item: { value: otherEntry } }) as CountryID
              ] = 1;
            }
          });
        });
      });
      return tradeBlocMatrix;
    })
  );
  public selectedNetworkNode = this.select("selectedNetworkNode");

  // when two participants show up within the same event, they have an arrow pointing between them
  // public eventParticipantsAsNetwork: Observable<RawNetwork<{ id: NodeID }>> =
  //   this.countriesInSameTradeBloc.pipe(
  //     map((adjMat) => adjMatToRawNetwork<NodeID>(adjMat))
  //   );
  // `QCode${NodeID}`

  // public eventAdjMat: Observable<AdjacencyMatrix> =
  //   this.eventParticipantsAsNetwork.pipe(
  //     map((network) => rawNetworkToAdjMat(network)),
  //     startWith([])
  //   );

  // public selectedNetworkNodeEventInfo: Observable<InfoPanelDateElement | null> =
  //   combineLatest([this.selectedNetworkNode, this.agents]).pipe(
  //     map(([val, agents]) => {
  //       if (val === null) {
  //         return null;
  //       }
  //       return { title: "Network", desc: `${agents[val].name}` };
  //     })
  //   );
  public eventParticipantsAsNetwork: Observable<RawNetwork> =
    this.countriesInSameTradeBloc.pipe(
      map((objAdjMat) => adjMatToRawNetwork(objAdjMat))
    );
  public networkNodesArray: Observable<NetworkNode[]> =
    this.eventParticipantsAsNetwork.pipe(
      map(({ nodes }) => {
        return nodes;
      })
    );

  public renderableEventNetworkNodes: Observable<RenderableNetworkNode[]> =
    combineLatest([this.networkNodesArray, this.networkNodeRenderProps]).pipe(
      map(([nodes, networkNodeRenderProps]) => {
        return nodes.map((node) => ({
          ...node,
          renderedProps: networkNodeRenderProps[node.id],
        }));
      })
    );

  public renderableEventEdges: Observable<RenderableNetworkEdge[]> =
    combineLatest([
      this.renderableEventNetworkNodes,
      this.eventParticipantsAsNetwork,
    ]).pipe(
      map(([nodes, { edges }]) => {
        return edges.map((edge) => {
          return {
            ...edge,
            renderedProps: {
              position: {
                origin: nodes.find(({ id }) => id === edge.origin)!
                  .renderedProps.position,
                target: nodes.find(({ id }) => id === edge.target)!
                  .renderedProps.position,
              },
            },
          };
        });
      })
    );

  // public adjMat:Observable<AdjMat> = this.countriesInSameTradeBloc.pipe(
  //   map((objAdj) => objAdjToAdj(objAdj))
  // );
}
export const dataQuery = new DataQuery(dataStore);
