import {
  HighlightSpecification,
  HistoricalEvent,
  WorldMapType,
} from "react-konva-components";
import { Observable } from "rxjs";
import { HexString, ObjV2, ScreenSpace } from "type-library";
import type {
  GenericArrow,
  NodeID,
  RawNetwork,
  RenderableNetworkEdge,
  RenderableNetworkNode,
  TimeSpace,
  Tree,
} from "type-library/src";
import {
  NetworkDashboardNode,
  WorldMapDashboardNode,
} from "./ConcreteDashboardNodes";
import { AdaptPlugin } from "./DashboardNodes";
import type { PeriodOrSingleton } from "./types";

export type TransformNodeType = "";
type FlavorShape = {
  Tree: { shape: Tree<object> };
  Boolean: { shape: boolean };
  String: { shape: string };
  Number: { shape: number };
  Network: { shape: RawNetwork };
  MultiModalNetwork: {
    shape: RawNetwork<{ id: NodeID; class: "A" } | { id: NodeID; class: "B" }>;
  };
  TimeFilter: { shape: { min: TimeSpace; max: TimeSpace } };
  NodeColorList: { shape: HexString[] };
  layoutMethod: { shape: "forceDirectedGraph" | "circular" | "tree" };
  Color: { shape: HexString };
  MapGeometry: { shape: WorldMapType<any, any>[] };
  IdList: { shape: number[] };
  OrderedEvents: {
    shape: HistoricalEvent<PeriodOrSingleton<TimeSpace>, any>[];
  };
  Time: TimeSpace;
};
// TODO maybe 'string list'/'number list'?
export type Flavor = keyof FlavorShape;
type FlavorSocket<TFlavor extends Flavor> = { id: string; flavor: TFlavor };
type FlavorJoint<TFlavor extends Flavor> = {
  id: string;
  flavor: TFlavor;
  jointDataObservable: Observable<FlavorShape[TFlavor]>;
  // getJointData: ()=>FlavorShape[TFlavor];
  // jointData: FlavorShape[TFlavor];
};
// type ZipArrays<
//   TArrayA extends any[],
//   TArrayB extends any[],
//   TCurrentIndex extends number = 0,
//   TRunningArray extends any[] = any[]
// > = TArrayA["length"] extends TArrayB["length"] ? ZipArrays<TArrayA,TArrayB,APlusB<TCurrentIndex,1>,[]> : never;
type TransformWidget<
  TInFlavor extends Record<string, Flavor>,
  TOutFlavor extends Record<string, Flavor>,
  TInKeys extends keyof TInFlavor = keyof TInFlavor,
  TOutKeys extends keyof TOutFlavor = keyof TOutFlavor,
  TIn extends FlavorSocket<TInFlavor[TInKeys]> = FlavorSocket<
    TInFlavor[TInKeys]
  >,
  TOut extends FlavorJoint<TOutFlavor[TOutKeys]> = FlavorJoint<
    TOutFlavor[TOutKeys]
  >
  // TODO make observable?
> = (inputs: TIn, outputs: TOut) => TOut;

// TODO optional sockets
// type FilterTime = TransformWidget<
//   { filter: "TimeFilter"; source: "OrderedEvents" },
//   { out: "OrderedEvents" }
// >;
export type TransformTreeToNetwork = TransformWidget<
  { in: "Tree" },
  { out: "Network" }
>;
export type CoallesceMulimodalNetwork = TransformWidget<
  { in: "MultiModalNetwork" },
  { out: "Network" }
>;
export type DashboardNodeConnection<TFlavor extends Flavor> = GenericArrow<
  FlavorJoint<TFlavor>,
  FlavorSocket<TFlavor>
>;
type TNodeComponentArgs<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
> = {
  inputs: TInputs;
  outputs: TOutputs;
  options: TOptions;
  dashboardNodeProps: { stageSize: ObjV2<ScreenSpace> };
};
export type DataNodeType<
  TOutputs extends Record<string, any>,
  TDataString extends string = string,
  TComponent extends TNodeComponent<null, TOutputs, null> = TNodeComponent<
    null,
    TOutputs,
    null
  >
> = IGenericDashboardNode<
  string,
  TDataString,
  null,
  TOutputs,
  null,
  TComponent,
  ["Data"]
>;
export type TNodeComponent<
  TInputs extends null | Record<string, any>,
  TOutputs extends null | Record<string, any>,
  TOptions extends null | Record<string, any>
> = (
  args: TNodeComponentArgs<
    TInputs extends null ? object : TInputs,
    TOutputs extends null ? object : TOutputs,
    TOptions extends null ? object : TOptions
  >
) => JSX.Element;
// TODO tooltip node? or tooltip per-node??
// TODO plugin architecture
// TODO 3d node? plugin
export type IGenericDashboardNode<
  TId extends string,
  TType extends string = AllowedNodes,
  TInputs extends null | Record<string, { flavor: Flavor }> = null,
  TOutputs extends null | Record<string, { flavor: Flavor }> = null,
  TOptions extends null | Record<string, { flavor: Flavor }> = null,
  // Component is only relevant for 'viewable' components - they might still have outputs (think like selections from a viewer)
  // TODO setSelected as service - anything based on viewer interaction needs access to a mutatable store
  // TODO 'register dashboard' in query/service
  TComponent extends null | TNodeComponent<TInputs, TOutputs, TOptions> = null,
  TGroup extends null | string[] = null,
  TObservable extends null | true = null
> = {
  id: TId;
  type: TType;
} & (TInputs extends null
  ? object
  : {
      inputs: TInputs;
    }) &
  (TOutputs extends null
    ? object
    : {
        outputs: TOutputs;
      }) &
  (TOptions extends null
    ? object
    : {
        options: TOptions;
      }) &
  (TGroup extends null
    ? object
    : {
        group: TGroup;
      }) &
  (TComponent extends null
    ? object
    : {
        Component: TComponent;
      }) &
  (TObservable extends null
    ? object
    : {
        functionObservable: (
          inputs: TInputs extends Record<string, { flavor: Flavor }>
            ? Observable<BreakdownFlavorMap<TInputs>>
            : null
        ) => Observable<TOutputs>;
      });

type BreakdownFlavorMap<
  TMap extends Record<string, { flavor: Flavor }>,
  TKeys extends keyof TMap = keyof TMap
> = Record<TKeys, FlavorShape[TMap[TKeys]["flavor"]]>;
export type IMapNode<TEntityKey extends number> = IGenericDashboardNode<
  string,
  "Map",
  {
    entities: {
      flavor: "MapGeometry";
      map: WorldMapType<TEntityKey, any>;
    };
    fills: {
      flavor: "NodeColorList";
      highlights: HighlightSpecification<TEntityKey>[];
    };
  },
  // TODO subflavor? flavor variety? (for concrete generics)
  { selectedEntities: { flavor: "IdList"; selected: TEntityKey[] } },
  null,
  typeof WorldMapDashboardNode
>;
export type ITimelineNode<TEntityKey extends number> = IGenericDashboardNode<
  string,
  "Timeline",
  {
    entities: {
      flavor: "OrderedEvents";
      events: HistoricalEvent<PeriodOrSingleton<TimeSpace>, TEntityKey>[];
    };
    fills: {
      flavor: "NodeColorList";
      highlights: HighlightSpecification<TEntityKey>[];
    };
    timelineEnd: { flavor: "Time"; timelineEnd: TimeSpace };
    timelineStart: { flavor: "Time"; timelineStart: TimeSpace };
  },
  { selectedEntities: { flavor: "IdList"; selecteds: TEntityKey[] } }
>;
// TODO this is effectively a lookup now so adding a manual | is sorta redundant
type AllowedNodeTypeLookup = {
  Map: AdaptPlugin<IMapNode<number>>;
  Network: any;
  Timeline: any;
  Share: any;
  Text: any;
  TreeMap: any;
  Info: any;
  Settings: any;
};
type AllowedNodes = keyof AllowedNodeTypeLookup;

export type INetworkNode = IGenericDashboardNode<
  string,
  "Network",
  {
    entities: {
      flavor: "Network";
      nodes: RenderableNetworkNode[];
      edges: RenderableNetworkEdge[];
      // nodes: { id: TEntityKey; color: HexString; radius: KonvaSpace }[];
      // edges: (GenericArrow<TEntityKey> & {
      //   lineThickness: KonvaSpace;
      //   lineColor: HexString;
      // })[];
    };
    initialLayoutMethod: {
      flavor: "layoutMethod";
      method: "forceDirectedGraph" | "circular" | "tree";
    };
    fills: {
      flavor: "NodeColorList";
      highlights: HighlightSpecification<NodeID>[];
    };
  },
  { selectedEntities: { flavor: "IdList"; nodes: NodeID[] } },
  null,
  typeof NetworkDashboardNode
>;
export type DashboardNodes<TMapEntityKey extends number = number> =
  | IMapNode<TMapEntityKey>
  // | INetworkNode<TNetworkEntityKey>
  | INetworkNode
  | ITimelineNode<number>;
