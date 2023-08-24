import { Query } from "@datorama/akita";

import {
  BilateralRelation,
  CountryHeartMap,
  CountryNameLookup,
  GeoJsonGeometryGeneric,
  HighlightSpecification,
  HistoricalEvent,
  adjMatToRawNetwork,
  detectConnectedComponentsFromAdjMat,
} from "react-konva-components/src";
import { Observable, combineLatest, debounceTime, map } from "rxjs";
import { NetworkNode, RawNetwork, RenderableNetworkEdge } from "type-library";
import type {
  HexString,
  ObjectAdjacencyMatrix,
  RenderableNetworkNode,
} from "type-library/src";
import { WDQCode } from "../../dataPrep/src/QCodes";
import { periodIsSegmentGuard } from "../Timeline";
import { themeColors } from "../theme";
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
import { COLORS } from "./COLORS";
import {
  CountryID,
  DataState,
  DataStore,
  QCode,
  dataStore,
  numericalQCode,
} from "./data.store";

export type BlocID = BrandedNumber<"BlocID">;

export const MembershipStatusStyling = {
  [WDQCode.MEMBER]: {
    default: true,
    color: themeColors.Pine,
    label: "Member",
  },
  [WDQCode.APPLICANT]: {
    color: themeColors.Grass,
    label: "Applicant",
  },
  [WDQCode.OBSERVER]: { color: themeColors.PaleGreen, label: "Observer" },
  [WDQCode.SUSPENDED]: { color: themeColors.Yellow, label: "Suspended" },
};

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
  // TODO fully connected subcomponents
  private filterYears = this.select("filterYears");
  private networkNodeRenderProps = this.select("networkNodeRenderProps").pipe(
    // debounce sorta bandaid measure - avoids updating & breaking dragging state
    // TODO - maybe drag state machine would take care of this? prob useful to just make it its own pkg
    debounceTime(100)
  );
  public tradeBlocs = this.select("tradeBlocs");
  public tradeBlocsQCodes = this.select("tradeBlocsQCodes");

  private unfilteredEvents = this.select("events");
  public intergovernmentalOrgs = this.select("intergovernmentalOrgs");
  public intergovernmentalOrgsQCodes = this.select(
    "intergovernmentalOrgsQCodes"
  );

  public geopoliticalGroups = this.select("geopoliticalGroups");
  public geopoliticalGroupsQCodes = this.select("geopoliticalGroupsQCodes");
  public selectedGeopoliticalGroup = this.select("selectedGeopoliticalGroup");

  public cumulativeGroups = combineLatest([
    this.geopoliticalGroups,
    this.tradeBlocs,
    this.intergovernmentalOrgs,
  ]).pipe(
    map(([geopoliticalGroups, tradeBlocs, intergovernmentalOrgs]) => [
      ...geopoliticalGroups,
      ...tradeBlocs,
      ...intergovernmentalOrgs,
    ])
  );
  public cumulativeGroupsQCodes = combineLatest([
    this.geopoliticalGroupsQCodes,
    this.tradeBlocsQCodes,
    this.intergovernmentalOrgsQCodes,
  ]).pipe(
    map(([geopoliticalGroups, tradeBlocs, intergovernmentalOrgs]) => ({
      ...geopoliticalGroups,
      ...tradeBlocs,
      ...intergovernmentalOrgs,
    }))
  );
  public availableGroups = this.cumulativeGroups.pipe(
    map((groups) => [...new Set(groups.map((group) => group.item.value))])
  );

  public countryColorLookup: Observable<
    (HighlightSpecification<CountryID> & {
      status: keyof typeof MembershipStatusStyling;
    })[]
  > = combineLatest([
    this.cumulativeGroups,
    this.selectedGeopoliticalGroup,
  ]).pipe(
    map(([groups, selectedGroup]) => {
      if (selectedGroup === null) {
        return [];
      }
      const relevantGroups = groups.filter(
        ({ item }) => item.value === selectedGroup
      );
      // TODO O(M*N here) where M is number of statuses - can do w one pass, after tests & benchmarks
      return Object.keys(MembershipStatusStyling).map((status) => {
        const styling = MembershipStatusStyling[status];
        return {
          highlightColor: styling.color,
          highlightedCountries: [
            ...new Set(
              relevantGroups
                .filter((element) => {
                  const hasMembershipClause = "membershipStatus" in element;
                  if ("default" in styling && styling.default === true) {
                    return (
                      !hasMembershipClause ||
                      element.membershipStatus.value === (status as any)
                    );
                  }
                  return (
                    hasMembershipClause &&
                    element.membershipStatus.value === (status as any)
                  );
                })
                .map(({ memberState }) =>
                  QCodeToCountryNumber(memberState.value as QCode<CountryID>)
                )
            ),
          ],
          status,
        };
      });
    })
  );
  public visibleGroupings = this.countryColorLookup.pipe(
    map((lookup) =>
      lookup
        .filter(({ highlightedCountries }) => highlightedCountries.length > 0)
        .map(({ status }) => MembershipStatusStyling[status])
    )
  );
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
  public countryToName: Observable<CountryNameLookup<number>> = combineLatest([
    this.rawCountries,
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
    ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1>
  > = combineLatest([this.blocMemberships]).pipe(
    map(([blocMemberships]) => {
      const groupedBlocs = Object.values(blocMemberships);
      const tradeBlocMatrix: ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1> =
        DataQuery.buildBlocMatrix(groupedBlocs);
      groupedBlocs.forEach((entryList) => {
        entryList.forEach((entry, ii) => {
          entryList.forEach((otherEntry, jj) => {
            if (jj > ii) {
              tradeBlocMatrix[QCodeToCountryCode(entry)][
                QCodeToCountryCode(otherEntry)
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

  public countryHeartMap: Observable<CountryHeartMap<CountryID>> =
    this.existingCountries.pipe(
      map((countries) => {
        return Object.fromEntries(
          countries.map((country) => {
            // Point(-63.067777777 18.031944444)
            const [lat, lon] = country.center.value
              .replace("Point(", "")
              .replace(")", "")
              .split(" ");
            return [
              numericalQCode(country),
              {
                type: "Point",
                geometry: {
                  type: "Point",
                  coordinates: [Number.parseFloat(lat), Number.parseFloat(lon)],
                },
              },
            ];
          })
        );
      })
    );
  public bilateralRelations: Observable<BilateralRelation<CountryID>[]> =
    this.countriesInSameTradeBloc.pipe(
      map((objAdjMat) => {
        const bilateralRelations: BilateralRelation<CountryID>[] = [];

        Object.keys(objAdjMat).forEach((iiID) => {
          Object.keys(objAdjMat[iiID]).forEach((jjID) => {
            if (objAdjMat[iiID][jjID] === 1) {
              bilateralRelations.push([
                Number.parseInt(iiID),
                Number.parseInt(jjID),
                1,
              ]);
            }
          });
        });
        return bilateralRelations;
      })
    );
  public communities: Observable<Record<number, `${CountryID}`[]>> =
    this.countriesInSameTradeBloc.pipe(
      map((adjMat) => {
        return detectConnectedComponentsFromAdjMat(adjMat);
      })
    );
  public nodeColorLookup: Observable<Record<`${CountryID}`, HexString>> =
    this.communities.pipe(
      map((communities) => {
        const lookup: Record<`${CountryID}`, HexString> = {};
        Object.keys(communities).forEach((key) => {
          communities[Number.parseInt(key)].forEach((country) => {
            lookup[country] = COLORS[Number.parseInt(key) % COLORS.length];
          });
        });
        return lookup;
        // return detectConnectedComponentsFromAdjMat(adjMat);
      })
    );

  public countryStarts: Observable<RenderableEvent[]> = combineLatest([
    this.countriesSortedByStart,
    this.filterYearsNullSafe,
    this.countriesQCodes,
    this.selectedCountry,
    this.nodeColorLookup,
  ]).pipe(
    map(
      ([
        countries,
        filterYearsNullSafe,
        qCodes,
        selectedCountry,
        nodeColorLookup,
      ]) => {
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
          return DataQuery.positionNode(
            country,
            start,
            end,
            qCodes,
            selectedCountry,
            nodeColorLookup
          );
        });
      }
    )
  );

  public static buildBlocMatrix(groupedBlocs: `Q${CountryID}`[][]) {
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
    const tradeBlocMatrix: ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1> =
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
    return tradeBlocMatrix;
  }

  public static positionNode(
    country: {
      item: { type: "uri"; value: `Q${CountryID}` };
      shape: {
        type: "uri";
        value: `http://commons.wikimedia.org/data/main/Data:${string}.map`;
      };
      stateStart: {
        // for time period events just position tooltip in the middle
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
        type: "literal";
        value: `${number}-${number}-${number}T${number}:${number}:${number}Z`;
      };
      center: {
        datatype: "http://www.opengis.net/ont/geosparql#wktLiteral";
        type: "literal";
        value: `Point(${number} ${number})`;
      };
      stateEnd: {
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
        type: "literal";
        value: `${number}-${number}-${number}T${number}:${number}:${number}Z`;
      };
    },
    start: TimeSpace,
    end: TimeSpace,
    qCodes: Record<
      `Q${CountryID}`,
      | "Northern Mariana Islands"
      | "Galicia"
      | "Estonia"
      | "Denmark"
      | "Latvia"
      | "Lithuania"
      | "Sint Maarten"
      | "Catalonia"
      | "Aruba"
      | "Greenland"
      | "Cook Islands"
      | "Faroe Islands"
      | "Niue"
      | "Saint Vincent and the Grenadines"
      | "Sierra Leone"
      | "Sudan"
      | "Somalia"
      | "Dominica"
      | "Jamaica"
      | "Afghanistan"
      | "Honduras"
      | "Grenada"
      | "Gibraltar"
      | "Guatemala"
      | "Saint Lucia"
      | "Dominican Republic"
      | "Antigua and Barbuda"
      | "Eswatini"
      | "Saint Kitts and Nevis"
      | "The Bahamas"
      | "Thailand"
      | "United Arab Emirates"
      | "Mali"
      | "Angola"
      | "Bangladesh"
      | "Vietnam"
      | "Turkmenistan"
      | "South Korea"
      | "Israel"
      | "Laos"
      | "Jordan"
      | "Lebanon"
      | "Nicaragua"
      | "Burkina Faso"
      | "Pakistan"
      | "Oman"
      | "Malaysia"
      | "Costa Rica"
      | "Qatar"
      | "Nepal"
      | "Iran"
      | "Haiti"
      | "Lesotho"
      | "Bhutan"
      | "Saudi Arabia"
      | "Central African Republic"
      | "El Salvador"
      | "Myanmar"
      | "Comoros"
      | "Zambia"
      | "Cape Verde"
      | "Botswana"
      | "Zimbabwe"
      | "Burundi"
      | "Yemen"
      | "Iraq"
      | "Kyrgyzstan"
      | "Maldives"
      | "South Sudan"
      | "Tajikistan"
      | "Taiwan"
      | "Syria"
      | "Sri Lanka"
      | "Mexico"
      | "Austria"
      | "Belarus"
      | "Hungary"
      | "Japan"
      | "United Kingdom"
      | "Ethiopia"
      | "Republic of Ireland"
      | "Bahrain"
      | "Vanuatu"
      | "Nauru"
      | "Tuvalu"
      | "New Zealand"
      | "Bolivia"
      | "Samoa"
      | "Chad"
      | "Czech Republic"
      | "Trinidad and Tobago"
      | "Slovakia"
      | "Tonga"
      | "Kazakhstan"
      | "Papua New Guinea"
      | "Singapore"
      | "Mongolia"
      | "Indonesia"
      | "Iceland"
      | "Palau"
      | "Solomon Islands"
      | "Federated States of Micronesia"
      | "Kiribati"
      | "Fiji"
      | "East Timor"
      | "Marshall Islands"
      | "Uzbekistan"
      | "Federal Islamic Republic of the Comoros"
      | "Canada"
      | "Norway"
      | "Uganda"
      | "Mauritius"
      | "Niger"
      | "Seychelles"
      | "Malawi"
      | "Rwanda"
      | "Madagascar"
      | "Kosovo"
      | "São Tomé and Príncipe"
      | "Kingdom of Iceland"
      | "Northern Cyprus"
      | "Spain"
      | "Northern Ireland"
      | "Belgium"
      | "Finland"
      | "Sweden"
      | "Poland"
      | "United States of America"
      | "Luxembourg"
      | "Portugal"
      | "Turkey"
      | "Switzerland"
      | "Italy"
      | "Greece"
      | "Brazil"
      | "People's Republic of China"
      | "Uruguay"
      | "Russia"
      | "Kenya"
      | "France"
      | "Egypt"
      | "Ghana"
      | "Germany"
      | "Philippines"
      | "Brunei"
      | "Tanzania"
      | "Tunisia"
      | "Togo"
      | "Chile"
      | "Australia"
      | "Argentina"
      | "Peru"
      | "India"
      | "Cambodia"
      | "Armenia"
      | "Benin"
      | "Liechtenstein"
      | "Algeria"
      | "North Korea"
      | "Romania"
      | "Albania"
      | "Bulgaria"
      | "Ecuador"
      | "Paraguay"
      | "Venezuela"
      | "Colombia"
      | "Croatia"
      | "Ukraine"
      | "Slovenia"
      | "Moldova"
      | "Guyana"
      | "North Macedonia"
      | "Montenegro"
      | "Eritrea"
      | "Djibouti"
      | "Republic of the Congo"
      | "Democratic Republic of the Congo"
      | "Equatorial Guinea"
      | "Guinea"
      | "Liberia"
      | "Cameroon"
      | "Libya"
      | "Guinea-Bissau"
      | "Gabon"
      | "The Gambia"
      | "Ivory Coast"
      | "Senegal"
      | "Morocco"
      | "Nigeria"
      | "Mauritania"
      | "Namibia"
      | "Mozambique"
      | "Wales"
      | "Netherlands"
      | "Malta"
      | "Cuba"
      | "South Africa"
      | "Cyprus"
      | "Andorra"
      | "Azerbaijan"
      | "Bosnia and Herzegovina"
      | "Kuwait"
      | "Georgia"
      | "Monaco"
      | "San Marino"
      | "Barbados"
      | "Belize"
      | "Vatican City"
      | "Serbia"
      | "Suriname"
      | "Panama"
    >,
    selectedCountry: CountryID | null,
    nodeColorLookup: Record<`${CountryID}`, `#${string}`>
  ) {
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
            : nodeColorLookup[`${genericProps.id as any}`] || "#AAAAAA",
        position: positioner(genericProps),
      },
    };
  }
  // public adjMat:Observable<AdjMat> = this.countriesInSameTradeBloc.pipe(
  //   map((objAdj) => objAdjToAdj(objAdj))
  // );
}
type CountryIDString<TCountryID extends CountryID> = `${TCountryID}`;
export const dataQuery = new DataQuery(dataStore);
function QCodeToCountryNumber<TCountryID extends CountryID>(
  entry: QCode<TCountryID>
): TCountryID {
  return Number.parseInt(entry.replace("Q", ""));
}
function QCodeToCountryCode<TCountryID extends CountryID>(
  entry: QCode<TCountryID>
): CountryIDString<TCountryID> {
  return `${QCodeToCountryNumber<TCountryID>(entry)}`;
}
