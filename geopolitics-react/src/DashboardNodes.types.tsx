import {
  HighlightSpecification,
  HistoricalEvent,
  TWorldMapEntity,
} from "react-konva-components/src";
import { Observable } from "rxjs";
import { NodeID } from "type-library";
import type {
  GenericArrow,
  HexString,
  KonvaSpace,
  RawNetwork,
  TimeSpace,
  Tree,
} from "type-library/src";
import { NetworkDashboardNode } from "./ConcreteDashboardNodes";
import type { PeriodOrSingleton } from "./types";

type TransformNodeType = "";
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
  NodeColorList: { shape: {} };
  MapGeometry: { shape: {} };
  IdList: { shape: {} };
  IdListSpec: { shape: {} };
  Array: { shape: {} };
  Color: { shape: {} };
  OrderedEvents: { shape: {} };
};
// TODO maybe 'string list'/'number list'?
export type Flavor = keyof FlavorShape;
type FlavorSocket<TFlavor extends Flavor> = { flavor: TFlavor };
type FlavorJoint<TFlavor extends Flavor> = {
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
};
export type DataNodeType<
  TOutputs extends Record<string, any>,
  TDataString extends string = string,
  TComponent extends TNodeComponent<null, TOutputs, null> = TNodeComponent<
    null,
    TOutputs,
    null
  >
> = IGenericNode<TDataString, null, TOutputs, null, TComponent, ["Data"]>;
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
export interface IGenericNode<
  TType extends string = AllowedNodes,
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
  >,
  // Component is only relevant for 'viewable' components - they might still have outputs (think like selections from a viewer)
  // TODO setSelected as service - anything based on viewer interaction needs access to a mutatable store
  // TODO 'register dashboard' in query/service
  TComponent extends TNodeComponent<
    TInputs,
    TOutputs,
    TOptions
  > = TNodeComponent<TInputs, TOutputs, TOptions>,
  TGroup extends string[] = ["Other"],
  TFunction extends TInputs extends Record<string, Flavor>
    ? TOutputs extends Record<string, Flavor>
      ? TransformWidget<TInputs, TOutputs>
      : undefined
    : undefined = TInputs extends Record<string, Flavor>
    ? TOutputs extends Record<string, Flavor>
      ? TransformWidget<TInputs, TOutputs>
      : undefined
    : undefined
> {
  type: TType;
  inputs: TInputs;
  outputs: TOutputs;
  options: TOptions;
  Component: TComponent;
  group?: TGroup;
  // maybe deprecate
  function?: TFunction;
  functionObservable?: (
    inputs: Observable<TInputs>[]
  ) => Observable<TOutputs>[];
}

export type IMapNode<TEntityKey extends number> = IGenericNode<
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
    fills: { flavor: "NodeColorList" } & HighlightSpecification<TEntityKey>[];
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
export type INetworkNode<TEntityKey extends number> = IGenericNode<
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
    fills: { flavor: "NodeColorList" } & HighlightSpecification<TEntityKey>[];
  },
  { selectedEntities: TEntityKey[] & { flavor: "IdList" } },
  typeof NetworkDashboardNode
>;
export type DashboardNodes<
  TMapEntityKey extends number = number,
  TNetworkEntityKey extends number = number
> =
  | IMapNode<TMapEntityKey>
  | INetworkNode<TNetworkEntityKey>
  | ITimelineNode<number>;
