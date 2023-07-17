import type { ObjV2, ScreenSpace } from "type-library/src";
import {
  NetworkDashboardNode,
  TimelineDashboardNode,
  WorldMapDashboardNode,
} from "./ConcreteDashboardNodes";
import type {
  DashboardNodeConnection,
  DashboardNodes,
  Flavor,
  IGenericNode,
  TNodeComponent,
} from "./DashboardNodes.types";

export function BuildInterface(
  nodes: DashboardNodes[]
  // dataSources: Record<string, DataNodeType>
  // TODO connect datasources
  // TODO encode datatype of a connection/input-output
  // TODO enforce tree structure?
): JSX.Element {
  return (
    <>
      {nodes.map(({ Component, inputs, outputs, options }) => {
        // <PluginAdapterNode>
        // </PluginAdapterNode>
        return (
          // TODO need to associate input w node somehow - dunno why it's a union type
          // Lookup type?
          <Component inputs={inputs} outputs={outputs} options={options} />
        );
      })}
    </>
  );
}
export function BuildNetwork<
  TType extends string,
  TInputs extends null | Record<string, { flavor: Flavor }> = Record<
    string,
    { flavor: Flavor }
  >,
  TOutputs extends null | Record<string, { flavor: Flavor }> = Record<
    string,
    { flavor: Flavor }
  >,
  TOptions extends null | Record<string, { flavor: Flavor }> = Record<
    string,
    { flavor: Flavor }
  >
>(
  nodes: IGenericNode<TType, TInputs, TOutputs, TOptions>[],
  edges: DashboardNodeConnection<any>[]
) {
  // TODO make sure is tree
  // TODO validate shape
  // TODO make sure joint allowed in socket
  // for each edge - connect the observable to the socket (connected to transformation function via `combineLatest`)
  // maybe start at the outputs & trace backwards from there?
}

// TODO different 'resize methods' per dashboardNode? ie 'stretch' 'center' etc
export type AdaptPlugin<
  // TODO no any
  TNode extends IGenericNode<any, any, any, any, any, any>,
  TInputs extends Record<string, any> = TNode["inputs"],
  TOutputs extends Record<string, any> = TNode["outputs"],
  TOptions extends Record<string, any> = TNode["options"]
> = PluginAdapterComponentArgs<TInputs, TOutputs, TOptions>;
type PluginAdapterComponentArgs<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
> = {
  stageSize: ObjV2<ScreenSpace>;
} & Parameters<TNodeComponent<TInputs, TOutputs, TOptions>>[0];

export type PluginAdapterNodeComponent<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
> = (
  args: PluginAdapterComponentArgs<TInputs, TOutputs, TOptions>
) => JSX.Element;

// take details regarding stage/any intermediate details we add later
// right now this allows us to resize/rearrange dashboard nodes
// might be able to use TreeMapPlanePartition
const PluginAdapterNode = <
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
>(
  args: Parameters<PluginAdapterNodeComponent<TInputs, TOutputs, TOptions>>[0]
) => {
  args.outputs;
  return <></>;
};
const DummyDashboardNode: TNodeComponent<object, object, object> = () => {
  return <></>;
};
function isNetworkValid(): boolean {
  return false;
}
// TODO dashboard node input/outputs are capacities - need an object i think - maybe just need the flavor?
const AvailableDashboardNodes: DashboardNodes[] = [
  {
    type: "Map",
    inputs: { entities: [], fills: [] },
    outputs: { selectedEntities: [] },
    options: {},
    Component: WorldMapDashboardNode,
    // component:  WorldMap,
  },
  {
    type: "Network",
    inputs: {
      entities: { nodes: [], edges: [] },
      initialLayoutMethod: "forceDirectedGraph",
    },
    outputs: { selectedEntities: [] },
    options: {},
    Component: NetworkDashboardNode,
    // component:  Network,
  },
  {
    type: "Timeline",
    inputs: { entities: [] },
    outputs: { selectedEntities: [] },
    options: {},
    Component: TimelineDashboardNode,
    // component:  Timeline,
  },
  {
    type: "Share",
    inputs: { entities: [] },
    outputs: {},
    options: {},
    Component: DummyDashboardNode,
    // component:  Timeline,
  },
  {
    type: "Text",
    inputs: {},
    outputs: {},
    options: {},
    Component: DummyDashboardNode,
    // component:  Text,
  },
  {
    type: "TreeMap",
    inputs: {},
    outputs: { clickedOns: [] },
    options: {},
    Component: DummyDashboardNode,
    // component:  TreeMapPlanePartition,
  },
  {
    type: "Info",
    inputs: {},
    outputs: {},
    options: {},
    Component: DummyDashboardNode,
    // component:  Text,
  },
  {
    type: "Settings",
    //   Knobs?
    inputs: {},
    outputs: {},
    options: {},
    Component: DummyDashboardNode,
    // component:  TreeMapPlanePartition,
  },
];
// WordCloud - named entity recognition included?
// RSS Feed data source/News Article (url input) then fed through text parsing node
// Sankey
// 2-tier networks (shared membership)
// tree network/Family Tree
// Plot
// WikiDataQuery Node (pre-received - maybe have a 'live' one?)
// Node to map number range to color gradient
// Fixed Input Node (number, string, Id)
