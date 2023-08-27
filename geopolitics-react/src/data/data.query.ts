import { Query } from "@datorama/akita";

import {
  BilateralRelation,
  CountryHeartMap,
  GeoJsonGeometryGeneric,
  HighlightSpecification,
  adjMatToRawNetwork,
  detectConnectedComponentsFromAdjMat,
  rawNetworkToAdjMat,
} from "react-konva-components/src";
import { Observable, combineLatest, debounceTime, map, switchMap } from "rxjs";
import { KonvaSpace } from "type-library";
import type {
  HexString,
  NetworkNode,
  ObjectAdjacencyMatrix,
  RawNetwork,
  RawNetworkDummy,
  RenderableNetworkEdge,
  RenderableNetworkNode,
} from "type-library/src";
import { WDQCode } from "../../dataPrep/src/QCodes";
import { periodIsSegmentGuard } from "../Timeline";
import { themeColors } from "../theme";
import { offsetDate } from "../timeTools";
import type { BrandedNumber, RenderableEvent, TimeSpace } from "../types";
import { COLORS } from "./COLORS";
import {
  CountryID,
  DataState,
  DataStore,
  MetaGrouping,
  MultilateralOrgType,
  QCode,
  dataStore,
} from "./data.store";
import {
  applyFiltersToEvents,
  buildEventPositioner,
  positionNode,
  sortEvents,
} from "./eventMethods";
import { numericalQCode, numericalQCodeDummy } from "./numericalQCode";

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
  [WDQCode.OBSERVER]: { color: themeColors.Pistachio, label: "Observer" },
  [WDQCode.SUSPENDED]: { color: themeColors.Sand, label: "Suspended" },
};

const getRandomColor = (): HexString => {
  const channelSize = 16;
  const charCode = new Array(6)
    .fill(0)
    .map(() => Math.round(Math.random() * channelSize).toString(16))
    .reduce((prev, curr) => prev + curr);

  return `#${charCode}`;
};
// TODO
// const parseDate=()=>{}
export class DataQuery extends Query<DataState> {
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
  private unfilteredEvents = this.select("events");

  public tradeBlocs = this.select("tradeBlocs");
  public intergovernmentalOrgs = this.select("intergovernmentalOrgs");
  public rawCountries = this.select("countries");
  public internationalOrgs = this.select("internationalOrgs");
  public geopoliticalGroups = this.select("geopoliticalGroups");

  public tradeBlocsQCodes = this.select("tradeBlocsQCodes");
  public intergovernmentalOrgsQCodes = this.select(
    "intergovernmentalOrgsQCodes"
  );
  private countriesQCodes = this.select("countriesQCodes");
  public internationalOrgsQCodes = this.select("internationalOrgsQCodes");
  public geopoliticalGroupsQCodes = this.select("geopoliticalGroupsQCodes");

  public selectedGeopoliticalGroup = this.select("selectedGeopoliticalGroup");
  public selectedNetworkGrouping = this.select("selectedNetworkGrouping");
  // private rawWars = this.select("wars");
  private countryOutlines = this.select("countriesOutlines");

  public initialDateFilter = this.select("initialDateFilter");
  public finalDateFilter = this.select("finalDateFilter");
  public selectedCountry = this.select("selectedCountry");

  public cumulativeGroups = combineLatest([
    this.geopoliticalGroups,
    this.tradeBlocs,
    this.intergovernmentalOrgs,
    this.internationalOrgs,
  ]).pipe(
    map(
      ([
        geopoliticalGroups,
        tradeBlocs,
        intergovernmentalOrgs,
        internationalOrgs,
      ]) => [
        ...geopoliticalGroups,
        ...tradeBlocs,
        ...intergovernmentalOrgs,
        ...internationalOrgs,
      ]
    )
  );
  public qCodesLookup: Observable<Record<QCode, string>> = combineLatest([
    this.countriesQCodes,
    this.geopoliticalGroupsQCodes,
    this.tradeBlocsQCodes,
    this.intergovernmentalOrgsQCodes,
    this.internationalOrgsQCodes,
  ]).pipe(
    map(
      ([
        countriesQCodes,
        geopoliticalGroups,
        tradeBlocs,
        intergovernmentalOrgs,
        internationalOrgsQCodes,
      ]) => ({
        ...countriesQCodes,
        ...geopoliticalGroups,
        ...tradeBlocs,
        ...intergovernmentalOrgs,
        ...internationalOrgsQCodes,
      })
    )
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
        ({ item }) => item.value === `Q${selectedGroup}`
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
                  const hasMembershipClause = hasMembershipGuard(element);
                  if ("default" in styling && styling.default === true) {
                    return (
                      !hasMembershipClause ||
                      element.membershipStatus.value === status
                    );
                  }
                  return (
                    hasMembershipClause &&
                    element.membershipStatus.value === status
                  );
                })
                .map(({ memberState }) =>
                  QCodeToCountryNumber(memberState.value as QCode<CountryID>)
                )
            ),
          ],
          status: status as any,
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
  public events = combineLatest([
    this.unfilteredEvents,
    this.initialDateFilter,
    this.finalDateFilter,
  ]).pipe(
    map(([events, initialDateFilter, finalDateFilter]) => {
      return applyFiltersToEvents(initialDateFilter, events, finalDateFilter);
    })
  );

  public numberEventsAfterFilter = this.events.pipe(
    map((events) => events.length)
  );

  public eventsSortedByStartDate = this.events.pipe(
    map((events) => {
      return sortEvents(events, "start");
    })
  );

  public eventsSortedByEndDate = this.events.pipe(
    map((events) => {
      return sortEvents(events, "end");
    })
  );

  public unfilteredEventsSortedByStartDate = this.unfilteredEvents.pipe(
    map((events) => {
      return sortEvents(events, "start");
    })
  );

  public unfilteredEventsSortedByEndDate = this.unfilteredEvents.pipe(
    map((events) => {
      return sortEvents(events, "end");
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

  private existingCountries = this.rawCountries.pipe(
    map((countries) => {
      return countries.filter((country) => {
        return country.stateEnd !== undefined;
      });
    })
  );
  // public countryLifeExpectancyLookup = this.existingCountries.pipe(
  //   map((countries) => {
  //     countries
  //       .filter((country) => "lifeExpectancy" in country)
  //       .map((country) => {
  //         return [country.lifeExpectancy, country.lifeExpectancyTime];
  //       });
  //   })
  // );

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
      const positioner = buildEventPositioner(earliest, latest);
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

  public selectedMetaGroup: Observable<readonly MultilateralOrgType[]> =
    this.selectedNetworkGrouping.pipe(
      switchMap((val) => {
        switch (val) {
          case MetaGrouping.TRADE_BLOCS:
            return this.tradeBlocs;
          case MetaGrouping.GEOPOLITICAL_GROUPS:
            return this.geopoliticalGroups;
          case MetaGrouping.INTERGOVERNMENTAL_ORGANIZATIONS:
            return this.intergovernmentalOrgs;
          case MetaGrouping.INTERNATIONAL_ORGANIZATIONS:
            return this.internationalOrgs;
          default:
            return [] as const;
        }
      })
    );
  public blocMemberships: Observable<
    Record<QCode<BlocID>, QCode<CountryID>[]>
  > = this.selectedMetaGroup.pipe(
    map((blocs) => {
      return buildBlocMemberLookup(blocs);
    })
  );
  // public countriesInSameTradeBloc: Observable<
  //   ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1>
  // > = combineLatest([this.blocMemberships]).pipe(
  //   map(([blocMemberships]) => {
  //     return calcCountriesInSameGroup(blocMemberships);
  //   })
  // );

  public countriesAndGroupsAsAdjMat: Observable<
    ObjectAdjacencyMatrix<`${CountryID | BlocID}`, 0 | 1>
  > = combineLatest([this.blocMemberships]).pipe(
    map(([blocMemberships]) => {
      return calcCountriesGroupMatrix(blocMemberships);
    })
  );
  public countriesVisibleInNetwork = this.blocMemberships.pipe(
    map((blocMemberships) => {
      const groupedBlocs = Object.values(blocMemberships);
      const uniqueEntitiesInTradeBlocs = [...new Set(groupedBlocs.flat())];

      return uniqueEntitiesInTradeBlocs;
    })
  );
  public selectedNetworkNode = this.select("selectedNetworkNode");

  // when two participants show up within the same event, they have an arrow pointing between them
  // public eventParticipantsAsNetwork: Observable<RawNetwork<{ id: NodeID }>> =
  //   this.countrieTradeBloc.pipe(
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
    this.countriesAndGroupsAsAdjMat.pipe(
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
          const originNode = nodes.find(({ id }) => id === edge.origin);
          const targetNode = nodes.find(({ id }) => id === edge.target);
          return {
            ...edge,
            renderedProps: {
              position: {
                // TODO should typewise distinguish
                origin: originNode
                  ? originNode.renderedProps.position
                  : { x: 0 as KonvaSpace, y: 0 as KonvaSpace },
                target: targetNode
                  ? targetNode.renderedProps.position
                  : { x: 0 as KonvaSpace, y: 0 as KonvaSpace },
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
            const { lat, lng } = country.center.value;
            return [
              numericalQCode(country),
              {
                type: "Point",
                geometry: {
                  type: "Point",
                  coordinates: [lat, lng],
                },
              },
            ];
          })
        );
      })
    );
  public bilateralRelations: Observable<BilateralRelation<CountryID>[]> =
    this.countriesAndGroupsAsAdjMat.pipe(
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
  public communities: Observable<Record<number, `${CountryID | BlocID}`[]>> =
    this.countriesAndGroupsAsAdjMat.pipe(
      map((adjMat) => {
        return detectConnectedComponentsFromAdjMat(adjMat);
      })
    );
  public nodeColorLookup: Observable<
    Record<`${CountryID | BlocID}`, HexString>
  > = this.communities.pipe(
    map((communities) => {
      const lookup: Record<`${CountryID | BlocID}`, HexString> = {};
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
          return positionNode(
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

  // public adjMat:Observable<AdjMat> = this.countriesInSameTradeBloc.pipe(
  //   map((objAdj) => objAdjToAdj(objAdj))
  // );
}
// type CountryIDString<TCountryID extends CountryID> = `${TCountryID}`;
export const dataQuery = new DataQuery(dataStore);

// function calcCountriesInSameGroup(
//   blocMemberships: Record<`Q${BlocID}`, `Q${CountryID}`[]>
// ) {
//   const groupedBlocs = Object.values(blocMemberships);
//   const uniqueEntitiesInTradeBlocs = [...new Set(groupedBlocs.flat())];

//   const tradeBlocMatrix: ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1> =
//     buildBlocMatrix(uniqueEntitiesInTradeBlocs);
//   groupedBlocs.forEach((entryList) => {
//     entryList.forEach((entry, ii) => {
//       entryList.forEach((otherEntry, jj) => {
//         if (jj > ii) {
//           tradeBlocMatrix[QCodeToCountryCode(entry)][
//             QCodeToCountryCode(otherEntry)
//           ] = 1;
//         }
//       });
//     });
//   });
//   return tradeBlocMatrix;
// }
function calcCountriesGroupMatrix(
  blocMemberships: Record<`Q${BlocID}`, `Q${CountryID}`[]>
) {
  const tradeBlocMatrix: ObjectAdjacencyMatrix<`${CountryID}`, 0 | 1> =
    buildMultiModalMatrix(blocMemberships);
  return tradeBlocMatrix;
}

function buildBlocMemberLookup(blocs: readonly MultilateralOrgType[]) {
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
}

function QCodeToCountryNumber<TCountryID extends CountryID>(
  entry: QCode<TCountryID>
): TCountryID {
  return Number.parseInt(entry.replace("Q", ""));
}
// function QCodeToCountryCode<TCountryID extends CountryID>(
//   entry: QCode<TCountryID>
// ): CountryIDString<TCountryID> {
//   return `${QCodeToCountryNumber<TCountryID>(entry)}`;
// }
const hasMembershipGuard = (
  element: MultilateralOrgType
): element is Required<MultilateralOrgType> => {
  return "membershipStatus" in element;
};

export function buildBlocMatrix(uniqueEntitiesInTradeBlocs: `Q${CountryID}`[]) {
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
          new Array(uniqueEntitiesInTradeBlocs.length).fill(0).map((_, jj) => [
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
export function buildMultiModalMatrix(
  groupedBlocs: Record<`Q${BlocID}`, `Q${CountryID}`[]>
) {
  const uniqueEntitiesInTradeBlocs = [
    ...new Set(Object.values(groupedBlocs).flat()),
  ];
  const countryNodes = uniqueEntitiesInTradeBlocs.map((entity) => ({
    id: numericalQCodeDummy<CountryID>(entity),
  }));
  const blocNodes = Object.keys(groupedBlocs).map((entity) => ({
    id: numericalQCodeDummy<BlocID>(entity),
  }));
  const rawNetwork: RawNetworkDummy<BlocID | CountryID> = {
    edges: [],
    nodes: [...countryNodes, ...blocNodes],
  };
  Object.keys(groupedBlocs).forEach((bloc) =>
    groupedBlocs[bloc].forEach((country) =>
      rawNetwork.edges.push({
        origin: numericalQCodeDummy<CountryID>(country),
        target: numericalQCodeDummy<BlocID>(bloc),
      })
    )
  );
  return rawNetworkToAdjMat<CountryID | BlocID>(rawNetwork);
}
