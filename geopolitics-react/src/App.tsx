import { ImperativePanelHandle } from "react-resizable-panels";

import { useEffect, useRef, useState } from "react";
import {
  LinePlot,
  Network,
  NetworkNodeTemplate,
  NodesComponentProps,
  WorldMap,
} from "react-konva-components/src";
import { HexString, KonvaSpace, NodeID, TimeSpace } from "type-library";
import { ArrV2 } from "type-library/src";
import { Timeline } from "./Timeline";
import { countryInfo } from "./countryData";
import { dataService } from "./data/data.service";
import { CountryID, QCode } from "./data/data.store";
import { intersectSets, subtractSets } from "./intersectSets";
import { MS_IN_YEAR, unoffsetDate } from "./timeTools";
import { useData } from "./useAkita";
type CountryCode = (typeof countryInfo)[number]["alpha-3"];
const allCountryCodes = countryInfo.map((val) => val["alpha-3"]);

type QCodeName = {
  qCode: QCode;
  name: string;
};

function Q({ qCode, name }: QCodeName): JSX.Element {
  return <a href={`https://www.wikidata.org/wiki/${qCode}`}>{name}</a>;
}
// type HighlightRecord<TKey extends number> = Record<
//   TKey,
//   HighlightSpecification<TKey>
// >;

// export function IntersectPartitions<
//   TCountryCode extends number,
//   TKeyA extends TCountryCode,
//   TKeyB extends TCountryCode
// >(
//   partitionA: HighlightRecord<TKeyA>,
//   partitionB: HighlightRecord<TKeyB>,
//   nameA: Readonly<number> = 0,
//   nameB: Readonly<number> = 1
// ): HighlightRecord<
//   `${TKeyA}-${TKeyB}` | `${typeof nameA}:${TKeyA}` | `${typeof nameB}:${TKeyB}`
// > {
//   const allPartitionA = Object.values(partitionA)
//     .map(
//       (val) =>
//         (val as HighlightSpecification<TCountryCode>).highlightedCountries
//     )
//     .flat() as TCountryCode[];
//   const allPartitionB = Object.values(partitionB)
//     .map(
//       (val) =>
//         (val as HighlightSpecification<TCountryCode>).highlightedCountries
//     )
//     .flat() as TCountryCode[];

//   const partitionsFromIntersections = Object.keys(partitionA)
//     .map((valA) => {
//       return Object.keys(partitionB).map((valB) => {
//         return [
//           `${valA}-${valB}`,
//           {
//             highlightedCountries: getIntersectionsBetween(
//               valA,
//               valB,
//               partitionA,
//               partitionB
//             ),
//             highlightColor: interpolateHexStrings(
//               partitionA[valA as TKeyA].highlightColor,
//               partitionB[valB as TKeyB].highlightColor
//             ),
//           },
//         ];
//       });
//     })
//     .flat();

//   const entriesInAButNotB = Object.keys(partitionA).map((valA) => [
//     `${nameA}:${valA}`,
//     {
//       highlightedCountries: getSubtraction(
//         partitionA[valA as TKeyA].highlightedCountries as TKeyA[],
//         allPartitionB
//       ),
//       highlightColor: partitionA[valA as TKeyA].highlightColor,
//     },
//   ]);
//   const entriesInBButNotA = Object.keys(partitionB).map((valB) => [
//     `${nameB}:${valB}`,
//     {
//       highlightedCountries: getSubtraction(
//         partitionB[valB as TKeyB].highlightedCountries as TKeyB[],
//         allPartitionA
//       ),
//       highlightColor: partitionB[valB as TKeyB].highlightColor,
//     },
//   ]);

//   return Object.fromEntries([
//     ...partitionsFromIntersections,
//     ...entriesInAButNotB,
//     ...entriesInBButNotA,
//   ]);
// }
function App() {
  const timelinePanelRef = useRef<ImperativePanelHandle>(null);
  useEffect(() => {
    if (timelinePanelRef.current) {
      // setPaneSize(timelinePanelRef.current.getSize());
    }
  }, [timelinePanelRef.current?.getSize]);
  // const regionColorMap: RegionColorMap = {
  //   Africa: "green",
  //   Americas: "yellow",
  //   Antarctica: "white",
  //   Asia: "blue",
  //   Europe: "cyan",
  //   Oceania: "red",
  // };
  const [
    {
      countryStarts,
      countries,
      countryToName,
      selectedCountry,
      filterYearsNullSafe,
      filterYearsRenderReady,
      // adjMat,
      renderableEventNetworkNodes: nodes,
      renderableEventEdges: edges,
      // eventParticipantsAsNetwork: rawNetwork,
      // selectedNetworkNode,
      countriesInSameTradeBloc,
      bilateralRelations,
      countryHeartMap,
      nodeColorLookup,
    },
  ] = useData([
    "countryHeartMap",
    "countryToName",
    "bilateralRelations",
    "countryStarts",
    "countries",
    "nodeColorLookup",
    "eventParticipantsAsNetwork",
    "selectedCountry",
    "filterYearsNullSafe",
    "filterYearsRenderReady",
    "renderableEventEdges",
    // "adjMat",
    "countriesInSameTradeBloc",
    "renderableEventNetworkNodes",
    "selectedNetworkNode",
  ]);
  const NodeTemplate: NodesComponentProps["NodeTemplate"] = ({ node }) => (
    <NetworkNodeTemplate
      onNodeMove={(updatingNode, event) =>
        dataService.moveNode(updatingNode, {
          x: event.target.x() as KonvaSpace,
          y: event.target.y() as KonvaSpace,
        })
      }
      highlightedNode={selectedCountry as any as NodeID | null}
      onMouseOver={(id) => {
        dataService.setHoveredNetworkNode(id);
      }}
      onSelectNode={(id) => {
        dataService.setSelectedCountry(id as any as CountryID);
      }}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onMouseLeave={() => {}}
      // onMouseLeave={() => {
      //   setHighlightedNode(null);
      // }}
      node={node}
    />
  );

  // const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [highlightedPlot, setHighlightedPlot] = useState<number | null>(null);

  useEffect(() => {
    if (countriesInSameTradeBloc !== undefined) {
      dataService.setNodesFromAdjMat(countriesInSameTradeBloc, {
        width: COLUMN_2_WIDTH,
        height: MAP_HEIGHT + TIMELINE_HEIGHT,
      });
      dataService.colorNetworkByCommunity(countriesInSameTradeBloc);
    }
  }, [countriesInSameTradeBloc]);
  const COLUMN_1_WIDTH = 256 * 4;
  const COLUMN_2_WIDTH = 512;
  const MAP_HEIGHT = 580;
  const TIMELINE_HEIGHT = 110;
  const NetworkGeneratorObject: QCodeName = {
    qCode: "Q1129645",
    name: "Trade Bloc",
  };

  return (
    <div>
      <div style={{ borderRadius: 10, backgroundColor: "#777777" }}>
        <div>DEMO APP</div>
        <p>
          Map shows <Q {...{ qCode: "Q6256", name: "countries" }} /> &{" "}
          <Q {...{ qCode: "Q161243", name: "dependent territories" }} />{" "}
          (outlines from wikidata), shows timeline with all state founding
          events.
        </p>
        <p>
          If an entity is selected in one, it will also become selected in the
          other
        </p>
        <p>Change Start Year & End Year to filter timeline </p>
        <p>
          Timeline shows beginning of state, Network shows membership in same{" "}
          <Q {...NetworkGeneratorObject} /> (fairly random choice, mainly to
          demonstrate community detection, handles any state membership object
          trivially at this point just by replacing the wikidata QCode for{" "}
          <Q {...NetworkGeneratorObject} /> with something else of the same
          shape)
        </p>
        <p>
          Network Node Color is arbitrary (other than yellow for selected node &
          gray on timeline for countries not included in network), indicates
          automatic detection of membership in same connected network
        </p>
      </div>
      {filterYearsRenderReady !== undefined && (
        <>
          <div>
            <p>START YEAR</p>
            <button
              onClick={() =>
                dataService.setFilterEndpoint(
                  "start",
                  filterYearsNullSafe.start + 1 * MS_IN_YEAR
                )
              }
            >
              +
            </button>
            <input
              value={filterYearsRenderReady.start}
              onChange={(val) => {
                dataService.setFilterEndpoint(
                  "start",
                  unoffsetDate(Number.parseInt(val.target.value) as TimeSpace)
                );
              }}
            />
            <button
              onClick={() =>
                dataService.setFilterEndpoint(
                  "start",
                  filterYearsNullSafe.start - 1 * MS_IN_YEAR
                )
              }
            >
              -
            </button>
          </div>
          <div>
            <p>END YEAR</p>
            <button
              onClick={() =>
                dataService.setFilterEndpoint(
                  "end",
                  filterYearsNullSafe.end + 1 * MS_IN_YEAR
                )
              }
            >
              +
            </button>
            <input
              value={filterYearsRenderReady.end}
              onChange={(val) => {
                dataService.setFilterEndpoint(
                  "end",
                  unoffsetDate(Number.parseInt(val.target.value) as TimeSpace)
                );
              }}
            />
            <button
              onClick={() =>
                dataService.setFilterEndpoint(
                  "end",
                  filterYearsNullSafe.end - 1 * MS_IN_YEAR
                )
              }
            >
              -
            </button>
          </div>
        </>
      )}
      <LinePlot
        stageSize={{ x: COLUMN_1_WIDTH, y: 200 }}
        data={[
          {
            points: [...Array(100).keys()].map(
              (ii) => [ii / 2, 10 * Math.sin(ii / 2)] as ArrV2
            ),
            color: highlightedPlot === 0 ? "#FFFF00" : ("#FF0000" as HexString),
          },
          {
            points: [...Array(100).keys()].map(
              (ii) => [ii / 2, -10 * Math.sin(ii / 2)] as ArrV2
            ),
            color: highlightedPlot === 1 ? "#FFFF00" : ("#0000FF" as HexString),
          },
        ]}
        centerPoint={{ x: -COLUMN_1_WIDTH / 2, y: 0 }}
        // centerPoint={{ x: 0, y: 0 }}
        plotRange={{
          min: {
            x: 0,
            y: -10,
          },
          max: {
            x: 100,
            y: 10,
          },
        }}
        onSelect={setHighlightedPlot}
      />
      {/* <SliderBar
        handlePercs={{ low: 0, high: 1 }}
        stageSize={{
          x: COLUMN_1_WIDTH,
          y: TIMELINE_HEIGHT / 2,
        }}
      /> */}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* <QuotedText /> */}
          {countryToName && countries && (
            <div>
              <WorldMap
                container={{
                  sizePx: { x: COLUMN_1_WIDTH, y: MAP_HEIGHT },
                  center: [0, 0],
                }}
                contents={{
                  countries,
                  countryToName,
                  countryHeartMap,
                  countryNodeColors: nodeColorLookup,
                  countryLines: bilateralRelations,
                  onClick: (id) =>
                    dataService.setSelectedCountry(id as CountryID),
                  highlights: [
                    {
                      highlightColor: "#FFFF00",
                      highlightedCountries:
                        selectedCountry !== null ? [selectedCountry] : [],
                    },
                  ],
                }}
              />
            </div>
          )}
          {countryStarts && (
            <Timeline
              // can only switch ID type bc rn we're using the same code, terrible pattern TODO
              onEventClick={(eventId) => {
                dataService.setSelectedCountry(eventId as any as CountryID);
              }}
              stageSize={{
                x: COLUMN_1_WIDTH,
                y: TIMELINE_HEIGHT,
              }}
              events={countryStarts}
              // we pass in "MS since Jan 1 1970"
            />
          )}
        </div>
        {true && (
          <Network
            nodes={nodes}
            edges={edges}
            stageSize={{
              x: COLUMN_2_WIDTH,
              y: TIMELINE_HEIGHT + MAP_HEIGHT,
            }}
            NodeTemplate={NodeTemplate}
          />
        )}
      </div>
      <p />
      <div>
        All visible data comes directly from WikiData (that means if theres any
        categorical inconsistency - blame them! or fix it yourself on wikidata &
        it will become fixed here too)
      </div>
      <div>Known Issues/TODOs:</div>
      <p>Needs a spinner while data's loading</p>
      <p>
        Way Too Slow (~5-6 sec to load basic app), once I add tests I'll be able
        to easily refactor without fear
      </p>
      <p>
        Network Placement algorithm has tendency to push nodes into corners
        (seed is random, reloading page might get a seed that looks better for
        current data, eventually will need to implement better algorithm)
      </p>
      <p>
        Network dragging choppy, interrupts drag (observable pattern problem)
      </p>
      <p>
        Some founding events are doubled (how to ontologically handle secession
        states?)
      </p>
      <p>Better experience using desktop, TODO make more mobile friendly</p>
      <p>Network Tooltip (generic konva tooltip)</p>
      <p>
        popups stay open in one until manually closed - make all controlled
        centrally
      </p>
      <p>
        Event Timeline Cluttered, filter helps but not very user friendly yet
      </p>
      <p>Need to figure out how to handle overlapping claims</p>
    </div>
    // <div style={{ width: canvasSize.x, height: canvasSize.y }}>
    //   <div className={styles.Container}>
    //     <PanelGroup direction="vertical">
    //       <Panel
    //         defaultSize={100}
    //         className={styles.Panel}
    //         ref={timelinePanelRef}
    //       >
    //         <div className={styles.PanelContent}>
    //           <Timeline stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* TEST */}
    //       </Panel>
    //       <ResizeHandle />
    //       <Panel className={styles.Panel}>
    //         <div className={styles.PanelContent}>
    //           <Network stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* <Timeline /> */}
    //         {/* <AddNewEvent /> */}
    //       </Panel>
    //     </PanelGroup>
    //   </div>
    // </div>
  );
}
export function getIntersectionsBetween<TCountryCode extends string>(
  keyA: keyof typeof partitionA,
  keyB: keyof typeof partitionB,
  partitionA: Record<string, { highlightedCountries: TCountryCode[] }>,
  partitionB: Record<string, { highlightedCountries: TCountryCode[] }>
): CountryCode[] {
  return [
    ...intersectSets(
      new Set(partitionA[keyA].highlightedCountries),
      new Set(partitionB[keyB].highlightedCountries)
    ),
  ];
}
export function getSubtraction<TCountryCode extends string>(
  aList: TCountryCode[],
  subList: TCountryCode[]
): TCountryCode[] {
  return [
    ...subtractSets(new Set(aList), new Set(subList), new Set(allCountryCodes)),
  ];
}

export default App;
