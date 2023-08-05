import type { ObjV2, ScreenSpace } from "type-library/src";
import type {
  DashboardNodeConnection,
  Flavor,
  IGenericDashboardNode,
  TNodeComponent,
} from "./DashboardNodes.types";

// export function BuildInterface(
//   nodes: DashboardNodes[]
//   // dataSources: Record<string, DataNodeType>
//   // TODO connect datasources
//   // TODO encode datatype of a connection/input-output
//   // TODO enforce tree structure?
// ): JSX.Element {
//   return (
//     <>
//       {nodes.map(({ Component, inputs, outputs, options }) => {
//         // <PluginAdapterNode>
//         // </PluginAdapterNode>
//         return (
//           // TODO need to associate input w node somehow - dunno why it's a union type
//           // Lookup type?
//           <Component
//             // TODO any
//             inputs={inputs as any}
//             outputs={outputs as any}
//             options={options as any}
//             dashboardNodeProps={{
//               stageSize: { x: 0 as ScreenSpace, y: 0 as ScreenSpace },
//             }}
//           />
//         );
//       })}
//     </>
//   );
// }
// todo enforce each dashboard node must either return an observable or a jsx element
export function BuildNetwork<
  TId extends string,
  TType extends string,
  TInputs extends null | Record<string, { flavor: Flavor }> = null,
  TOutputs extends null | Record<string, { flavor: Flavor }> = null,
  TOptions extends null | Record<string, { flavor: Flavor }> = null
>(
  nodes: IGenericDashboardNode<
    TId,
    TType,
    TInputs,
    TOutputs,
    TOptions,
    null,
    null,
    true
  >[],
  edges: DashboardNodeConnection<any>[]
) {
  // need to start from the data sources?
  /**
   * start at one outermost data node (shouldnt matter which)
   * check if it has an edge. If so follow it. We are now at a transformation node
   * if a transformation node needs another input then find an edge where this slot is the target. If none exists, throw error.
   * once we have this slot, find the outermost node of this tree
   */
  edges.forEach((edge) => {
    const originNode = nodes.find((val) => val.id === edge.origin.id);
    const targetNode = nodes.find((val) => val.id === edge.target.id);
    if (!originNode || !targetNode) {
      return {};
    }
    // TODO formalize 'terminus node' - for dashboard it'd be the grid arranger node?
    // think it might be better for the origin to have a lazy 'getObservableValue' method - maybe nicest to just do one pass of 'connect things up' then start at the terminus node & just call the 'get' for that & let it cascade
    // targetNode.functionObservable(originNode.functionObservable(of({})));
  });
  // TODO make sure is tree
  // TODO validate shape
  // TODO make sure joint allowed in socket
  // for each edge - connect the observable to the socket (connected to transformation function via `combineLatest`)
  // maybe start at the outputs & trace backwards from there?
}

// TODO different 'resize methods' per dashboardNode? ie 'stretch' 'center' etc
export type AdaptPlugin<
  // TODO no any
  TNode extends IGenericDashboardNode<any, any, any, any, any, any>,
  TInputs extends Record<string, any> = TNode extends { inputs: any }
    ? TNode["inputs"]
    : null,
  TOutputs extends Record<string, any> = TNode extends { outputs: any }
    ? TNode["outputs"]
    : null,
  TOptions extends Record<string, any> = TNode extends { options: any }
    ? TNode["options"]
    : null
> = PluginAdapterComponentArgs<TInputs, TOutputs, TOptions>;
type PluginAdapterComponentArgs<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
> = {
  dashboardNodeProps: {
    stageSize: ObjV2<ScreenSpace>;
  };
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
// const PluginAdapterNode = <
//   TInputs extends Record<string, any>,
//   TOutputs extends Record<string, any>,
//   TOptions extends Record<string, any>
// >(
//   args: Parameters<PluginAdapterNodeComponent<TInputs, TOutputs, TOptions>>[0]
// ) => {
//   args.outputs;
//   return <></>;
// };
// const DummyDashboardNode: TNodeComponent<object, object, object> = () => {
//   return <></>;
// };
// function isNetworkValid(): boolean {
//   return false;
// }
// TODO dashboard node input/outputs are capacities - need an object i think - maybe just need the flavor?
// export const AvailableDashboardNodes: DashboardNodes[] = [
//   {
//     type: "Map",
//     inputs: {
//       entities: {
//         flavor: "MapGeometry",
//         map: {
//           container: { center: [0, 0], sizePx: { x: 0, y: 0 } },
//           contents: { countries: [], countryToName: {}, countryToRegion: {} },
//         },
//       },
//       fills: { flavor: "NodeColorList", highlights: [] },
//     },
//     outputs: { selectedEntities: { flavor: "IdList", selected: [] } },
//     options: null,
//     Component: WorldMapDashboardNode,
//     // component:  WorldMap,
//   },
//   {
//     type: "Network",
//     inputs: {
//       fills: { flavor: "NodeColorList", highlights: [] },
//       entities: { nodes: [], edges: [], flavor: "Network" },
//       initialLayoutMethod: {
//         flavor: "layoutMethod",
//         method: "forceDirectedGraph",
//       },
//     },
//     outputs: { selectedEntities: { flavor: "IdList", nodes: [] } },
//     options: null,
//     Component: NetworkDashboardNode,
//     // component:  Network,
//   },
//   {
//     type: "Timeline",
//     inputs: {
//       entities: { flavor: "OrderedEvents", events: [] },
//       fills: { flavor: "NodeColorList", highlights: [] },
//       timelineEnd: { flavor: "Time", timelineEnd: 0 as TimeSpace },
//       timelineStart: { flavor: "Time", timelineStart: 0 as TimeSpace },
//       // map:{''}
//     },
//     outputs: { selectedEntities: { flavor: "IdList", selecteds: [] } },
//     options: {},
//     // TODO weird bug
//     Component: TimelineDashboardNode as any,
//     // component:  Timeline,
//   },
//   // {
//   //   type: "Share",
//   //   inputs: { entities: [] },
//   //   outputs: {},
//   //   options: {},
//   //   Component: DummyDashboardNode,
//   //   // component:  Timeline,
//   // },
//   // {
//   //   type: "Text",
//   //   inputs: {},
//   //   outputs: {},
//   //   options: {},
//   //   Component: DummyDashboardNode,
//   //   // component:  Text,
//   // },
//   // {
//   //   type: "TreeMap",
//   //   inputs: {},
//   //   outputs: { clickedOns: [] },
//   //   options: {},
//   //   Component: DummyDashboardNode,
//   //   // component:  TreeMapPlanePartition,
//   // },
//   // {
//   //   type: "Info",
//   //   inputs: {},
//   //   outputs: {},
//   //   options: {},
//   //   Component: DummyDashboardNode,
//   //   // component:  Text,
//   // },
//   // {
//   //   type: "Settings",
//   //   //   Knobs?
//   //   inputs: {},
//   //   outputs: {},
//   //   options: {},
//   //   Component: DummyDashboardNode,
//   //   // component:  TreeMapPlanePartition,
//   // },
// ];
// WordCloud - named entity recognition included?
// RSS Feed data source/News Article (url input) then fed through text parsing node
// Sankey
// 2-tier networks (shared membership)
// tree network/Family Tree
// Plot
// WikiDataQuery Node (pre-received - maybe have a 'live' one?)
// Node to map number range to color gradient
// Fixed Input Node (number, string, Id)
