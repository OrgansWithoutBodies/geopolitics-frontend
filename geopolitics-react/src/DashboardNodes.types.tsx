import {
  HighlightSpecification,
  HistoricalEvent,
  Network,
  TWorldMapEntity,
} from "react-konva-components/src";
import {
  GenericArrow,
  HexString,
  KonvaSpace,
  RawNetwork,
  TimeSpace,
  Tree,
} from "type-library";
import { PeriodOrSingleton } from "./types";

type TransformNodeType = "";
type FlavorShape = {
  Tree: { shape: Tree<object> };
  Network: { shape: RawNetwork };
  MultiModalNetwork: { shape: RawNetwork<{ class: "A" } | { class: "B" }> };
  TimeFilter: { shape: { min: TimeSpace; max: TimeSpace } };
  NodeColorList: { shape: {} };
  MapGeometry: { shape: {} };
  IdList: { shape: {} };
  IdListSpec: { shape: {} };
  Array: { shape: {} };
  Color: { shape: {} };
  OrderedEvents: { shape: {} };
};
// TODO maybe 'string list'/'number list'?
type Flavor = keyof FlavorShape;
type FlavorSocket<TFlavor extends Flavor> = { flavor: TFlavor };
type FlavorJoint<TFlavor extends Flavor> = {
  flavor: TFlavor;
  //   getJointData: ()=>FlavorShape[TFlavor];
  jointData: FlavorShape[TFlavor];
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
> = (inputs: TIn, outputs: TOut) => TOut;

// TODO optional sockets
type FilterTime = TransformWidget<
  { filter: "TimeFilter"; source: "OrderedEvents" },
  { out: "OrderedEvents" }
>;
type TransformTreeToNetwork = TransformWidget<
  { in: "Tree" },
  { out: "Network" }
>;
type CoallesceMulimodalNetwork = TransformWidget<
  { in: "MultiModalNetwork" },
  { out: "Network" }
>;
type DashboardNodeConnections<TFlavor extends Flavor> = GenericArrow<
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
};
export type DataNodeType<
  TOutputs extends Record<string, any>,
  TDataString extends string = string,
  TComponent extends TNodeComponent<object, TOutputs, object> = TNodeComponent<
    object,
    TOutputs,
    object
  >
> = IGenericNode<TDataString, object, TOutputs, object, TComponent, ["Data"]>;
export type TNodeComponent<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TOptions extends Record<string, any>
> = (args: TNodeComponentArgs<TInputs, TOutputs, TOptions>) => JSX.Element;
// TODO tooltip node? or tooltip per-node??
// TODO plugin architecture
// TODO 3d node? plugin
export interface IGenericNode<
  TType extends string = AllowedNodes,
  TInputs extends Record<string, { flavor: Flavor } & unknown> = Record<
    string,
    { flavor: Flavor } & unknown
  >,
  TOutputs extends Record<string, { flavor: Flavor } & unknown> = Record<
    string,
    { flavor: Flavor } & unknown
  >,
  TOptions extends Record<string, { flavor: Flavor } & unknown> = Record<
    string,
    { flavor: Flavor } & unknown
  >,
  TComponent extends TNodeComponent<
    TInputs,
    TOutputs,
    TOptions
  > = TNodeComponent<TInputs, TOutputs, TOptions>,
  TGroup extends string[] = ["Other"]
> {
  type: TType;
  inputs: TInputs;
  outputs: TOutputs;
  options: TOptions;
  Component: TComponent;
  group: TGroup;
}

export type IMapNode<TEntityKey extends string> = IGenericNode<
  "Map",
  {
    entities: { flavor: "MapGeometry" } & TWorldMapEntity<TEntityKey>[];
    fills: { flavor: "NodeColorList" } & HighlightSpecification<TEntityKey>[];
  },
  // TODO subflavor? flavor variety? (for concrete generics)
  { selectedEntities: { flavor: "IdList" } & TEntityKey[] }
>;
export type ITimelineNode<TEntityKey extends number> = IGenericNode<
  "Timeline",
  {
    entities: { flavor: "OrderedEvents" } & HistoricalEvent<
      PeriodOrSingleton<TimeSpace>,
      TEntityKey
    >[];
  },
  { selectedEntities: { flavor: "IdList" } & TEntityKey[] }
>;
// TODO this is effectively a lookup now so adding a manual | is sorta redundant
type AllowedNodes =
  | "Map"
  | "Network"
  | "Timeline"
  | "Share"
  | "Text"
  | "TreeMap"
  | "Info"
  | "Settings";
export type INetworkNode<TEntityKey extends string> = IGenericNode<
  "Network",
  {
    entities: { flavor: "Network" } & {
      nodes: { id: TEntityKey; color: HexString; radius: KonvaSpace }[];
      edges: (GenericArrow<TEntityKey> & {
        lineThickness: KonvaSpace;
        lineColor: HexString;
      })[];
    };
    initialLayoutMethod: { flavor: "Array" } & (
      | "forceDirectedGraph"
      | "circular"
      | "tree"
    );
  },
  { selectedEntities: TEntityKey[] & { flavor: "IdList" } },
  typeof Network
>;
export type DashboardNodes<
  TMapEntityKey extends string = string,
  TNetworkEntityKey extends string = string
> =
  | IMapNode<TMapEntityKey>
  | INetworkNode<TNetworkEntityKey>
  | ITimelineNode<number>;
