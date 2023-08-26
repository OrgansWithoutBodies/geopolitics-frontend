import { useEffect } from "react";
import {
  MapContentsType,
  Network,
  NetworkNodeTemplate,
  NetworkNodeTemplateStar,
  NodesComponentProps,
  WorldMap,
} from "react-konva-components/src";
import { HexString, KonvaSpace, NodeID, TimeSpace } from "type-library";
import { WDPCode } from "../dataPrep/src/PCodes";
import { WDQCode } from "../dataPrep/src/QCodes";
import { Timeline } from "./Timeline";
import { dataService } from "./data/data.service";
import { CountryID, DataState, GroupID, PCode, QCode } from "./data/data.store";
import { numericalQCodeDummy } from "./data/numericalQCode";
import { themeColors } from "./theme";
import { MS_IN_YEAR, unoffsetDate } from "./timeTools";
import { useData } from "./useAkita";

const COLUMN_1_WIDTH = 256 * 4;
const COLUMN_2_WIDTH = 512;
const MAP_HEIGHT = 580;
const TIMELINE_HEIGHT = 110;
export const NetworkStageSize = {
  x: COLUMN_2_WIDTH,
  y: TIMELINE_HEIGHT + MAP_HEIGHT,
};
type QCodeName = {
  qCode: QCode;
  name: string;
};
type PCodeName = {
  pCode: PCode;
  name: string;
};
const wikidataBaseURL = "https://www.wikidata.org/wiki/";
function Q({ qCode, name }: QCodeName): JSX.Element {
  return <a href={`${wikidataBaseURL}${qCode}`}>{name}</a>;
}
function P({ pCode, name }: PCodeName): JSX.Element {
  return <a href={`${wikidataBaseURL}Property:${pCode}`}>{name}</a>;
}

function WD(code: PCodeName | QCodeName): JSX.Element {
  return "qCode" in code ? <Q {...code} /> : <P {...code} />;
}
// TODO connect this to filtered time
const today = new Date();
const asOfDate = `${today.getDate()} ${today.toLocaleString("default", {
  month: "long",
})} ${today.getFullYear()}`;
function App() {
  const [
    {
      countryStarts,
      countries,
      qCodesLookup,
      selectedCountry,
      filterYearsNullSafe,
      filterYearsRenderReady,
      // adjMat,
      renderableEventNetworkNodes: nodes,
      renderableEventEdges: edges,
      // eventParticipantsAsNetwork: rawNetwork,
      // selectedNetworkNode,
      countriesAndGroupsAsAdjMat,
      countriesVisibleInNetwork,
      rawCountries,
      bilateralRelations,
      countryHeartMap,
      nodeColorLookup,
      countryColorLookup,
      availableGroups,
      selectedGeopoliticalGroup,
      visibleGroupings: RankedEntries,
    },
  ] = useData([
    "countryHeartMap",
    "visibleGroupings",
    "qCodesLookup",
    "availableGroups",
    "selectedGeopoliticalGroup",
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
    "countriesAndGroupsAsAdjMat",
    "renderableEventNetworkNodes",
    "countriesVisibleInNetwork",
    "selectedNetworkNode",
    "countryColorLookup",
    "rawCountries",
  ]);

  // TODO be able to have a multimodal network - ie put countries & multilateral orgs in same network (diff shape - star?)
  const countryIDs: QCode<CountryID>[] = rawCountries
    ? rawCountries.map((val) => val.item.value)
    : [];
  // const groupIDs: NodeID[] = [];
  const NodeTemplate: NodesComponentProps["NodeTemplate"] = ({ node }) => {
    const Template =
      node.id in countryIDs ? NetworkNodeTemplate : NetworkNodeTemplateStar;
    return (
      <Template
        onNodeMove={(updatingNode, event) =>
          dataService.moveNode(updatingNode, {
            x: clipValueToRange(event.target.x(), {
              min: 0,
              max: NetworkStageSize.x,
            }) as KonvaSpace,
            y: clipValueToRange(event.target.y(), {
              min: 0,
              max: NetworkStageSize.y,
            }) as KonvaSpace,
          })
        }
        // TODO
        highlightedNode={selectedCountry as any as NodeID | null}
        onMouseOver={(id) => {
          dataService.setHoveredNetworkNode(id);
        }}
        onSelectNode={(id) => {
          dataService.setSelectedCountry(id as any as CountryID);
        }}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onMouseLeave={() => {}}
        node={node}
        textLookup={numericalQCodeLookup}
      />
    );
  };
  // const [loading, setLoading] = useState<boolean>(false);
  const loading = false;
  useEffect(() => {
    if (countriesAndGroupsAsAdjMat !== undefined) {
      dataService.setNodesFromAdjMat(countriesAndGroupsAsAdjMat, {
        width: COLUMN_2_WIDTH,
        height: MAP_HEIGHT + TIMELINE_HEIGHT,
      });
      dataService.colorNetworkByCommunity(countriesAndGroupsAsAdjMat);
    }
  }, [countriesAndGroupsAsAdjMat]);

  const NetworkGeneratorObject: QCodeName = {
    qCode: WDQCode.TRADE_BLOCS,
    name: "Trade Bloc",
  };
  const InceptionProp: PCodeName = {
    pCode: WDPCode.INCEPTION,
    name: "State Founding Events",
  };

  const numericalQCodeLookup = qCodesLookup
    ? Object.fromEntries(
        Object.entries(qCodesLookup).map(([key, value]) => [
          numericalQCodeDummy(key),
          value,
        ])
      )
    : {};
  return (
    <div>
      {loading && (
        <InfoBar
          text={"loading..."}
          backgroundColor={themeColors.Tangerine}
          color={themeColors.K}
        />
      )}
      {
        <Preamble
          InceptionProp={InceptionProp}
          NetworkGeneratorObject={NetworkGeneratorObject}
        />
      }
      {filterYearsRenderReady !== undefined && (
        <TimeFilter
          filterYearsNullSafe={filterYearsNullSafe}
          filterYearsRenderReady={filterYearsRenderReady}
        />
      )}
      <button
        onClick={async () => {
          // setLoading(true);
          await dataService.setNodesFromAdjMat(countriesAndGroupsAsAdjMat, {
            width: COLUMN_2_WIDTH,
            height: MAP_HEIGHT + TIMELINE_HEIGHT,
          });
          // setLoading(false);
        }}
      >
        Reset Network Layout
      </button>
      {availableGroups && qCodesLookup && (
        <p>
          Grouping:
          <select
            onChange={(event) => {
              console.log(event, event.target.value);
              dataService.setSelectedGeopoliticalGroup(
                event.target
                  .value as any as DataState["selectedGeopoliticalGroup"]
              );
            }}
          >
            {/* TODO any */}
            <option value={null as any}>---</option>
            {availableGroups.map((group) => (
              <option value={group}>{qCodesLookup[group]}</option>
            ))}
          </select>
        </p>
      )}
      {/* <LinePlot
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
      /> */}
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
          {qCodesLookup && countries && (
            <div>
              <WorldMap
                container={{
                  sizePx: { x: COLUMN_1_WIDTH, y: MAP_HEIGHT },
                  center: [0, 0],
                }}
                contents={{
                  countries,
                  countryToName: numericalQCodeLookup,
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
                    ...countryColorLookup,
                  ],
                  labels:
                    selectedGeopoliticalGroup === null
                      ? []
                      : buildLabel(
                          numericalQCodeLookup,
                          selectedGeopoliticalGroup,
                          RankedEntries
                        ),
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
        {
          <Network
            nodes={nodes}
            edges={edges}
            stageSize={NetworkStageSize}
            NodeTemplate={NodeTemplate}
          />
        }
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
        Network dragging needs improving, flips back to original position
        briefly when selected on mouse up
      </p>
      <p>
        MouseUp in konva network gets interpreted as select on dragging - need
        state machine
      </p>
      <p>
        Figure out what to do with non-country entities in network (ignore?)
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
    //     <PanelGroup direction="vertical">
    //       <Panel
    //         defaultSize={100}
    //         className={styles.Panel}
    //         ref={timelinePanelRef}
    //       >
    //       </Panel>
    //     </PanelGroup>
  );
}

export default App;
function buildLabel(
  qCodesLookup: Record<
    `Q${import("/home/v/Projects/Geopolitics/frontend/geopolitics-react/src/data/data.store").GroupID}`,
    string
  >,
  selectedGeopoliticalGroup: GroupID,
  RankedEntries: (
    | { default: boolean; color: "#285330"; label: string }
    | { color: "#48CC61"; label: string; default?: undefined }
    | { color: "#C1ECC9"; label: string; default?: undefined }
    | { color: "#EAEA77"; label: string; default?: undefined }
  )[]
): MapContentsType<CountryID>["labels"] {
  return [
    {
      type: "text",
      text: qCodesLookup[`Q${selectedGeopoliticalGroup}`],
      fontWeight: "bolder",
      fontSize: 50,
      position: {
        lat: -10 - RankedEntries.length * 10,
        lng: -140,
      },
    },

    {
      type: "text",
      text: `As of ${asOfDate}`,
      fontWeight: "lighter",
      fontSize: 20,
      position: {
        lat: 0,
        lng: -140,
      },
    },
    ...RankedEntries.map((entry, ii) => {
      return {
        type: "colorbox",
        colorBox: entry.color,
        text: entry.label,
        fontWeight: "normal",
        fontSize: 20,
        colorBoxSize: 20,
        position: { lat: -10 - ii * 10, lng: -140 },
      } as const;
    }),
  ];
}

function Preamble({
  InceptionProp,
  NetworkGeneratorObject,
}: {
  InceptionProp: PCodeName;
  NetworkGeneratorObject: QCodeName;
}) {
  return (
    <div style={{ borderRadius: 10, backgroundColor: "#777777" }}>
      <div>DEMO APP</div>
      <p>
        Map shows <WD {...{ qCode: "Q6256", name: "countries" }} /> &{" "}
        <WD {...{ qCode: "Q161243", name: "dependent territories" }} /> (
        <WD {...{ pCode: "P3896", name: "outlines" }} /> from wikidata), shows
        timeline with all <WD {...InceptionProp} />
      </p>
      <p>
        If an entity is selected in one widget, it will also become selected in
        all other widgets
      </p>
      <p>Change Start Year & End Year to filter timeline </p>
      <p>
        Map fill colors are based on membership of grouping selected from
        dropdown (currently can choose between{" "}
        <WD {...NetworkGeneratorObject} />,{" "}
        <WD
          {...{
            qCode: WDQCode.GEOPOLITICAL_GROUPS,
            name: "geopolitical groups",
          }}
        />{" "}
        &{" "}
        <WD
          {...{
            qCode: WDQCode.INTERGOVERNMENTAL_ORGANIZATIONS,
            name: "intergovernmental organizations",
          }}
        />
        )
      </p>
      <p>
        Timeline shows beginning of state, Network shows{" "}
        <WD {...{ pCode: "P527", name: "Membership" }} /> in same{" "}
        <WD {...NetworkGeneratorObject} /> (fairly random choice, mainly to
        demonstrate community detection, handles any state{" "}
        <WD {...{ pCode: "P527", name: "Membership" }} /> object trivially at
        this point just by replacing the wikidata QCode for{" "}
        <WD {...NetworkGeneratorObject} /> with something else of the same
        shape)
      </p>
      <p>
        Network Node Color is arbitrary (other than yellow for selected node &
        gray on timeline for countries not included in network), indicates
        automatic detection of <WD {...{ pCode: "P527", name: "Membership" }} />{" "}
        in same connected network
      </p>
    </div>
  );
}

function TimeFilter({
  filterYearsRenderReady,
  filterYearsNullSafe,
}: {
  filterYearsNullSafe: {
    start: TimeSpace;
    end: TimeSpace;
  };
  filterYearsRenderReady: { start: number; end: number };
}) {
  return (
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
  );
}

export const clipValueToRange = (
  value: number,
  { min, max }: { min: number; max: number }
): number => {
  return Math.min(Math.max(value, min), max);
};

function InfoBar({
  text,
  color,
  backgroundColor,
}: {
  text: string;
  backgroundColor: HexString;
  color: HexString;
}): JSX.Element {
  return (
    <div
      style={{
        backgroundColor,
        color,
        position: "fixed",
        top: 0,
        width: "100%",
      }}
    >
      {text}
    </div>
  );
}
