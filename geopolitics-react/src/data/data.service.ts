import {
  detectConnectedComponentsFromAdjMat,
  forceDirectedGraph,
  objAdjToAdj,
} from "react-konva-components/src";
import { HexString } from "type-library";
import type {
  KonvaSpace,
  NodeID,
  ObjV2,
  ObjectAdjacencyMatrix,
} from "type-library/src";
import { NetworkStageSize } from "../App";
import { COLORS } from "./COLORS";
import { DataState, DataStore, dataStore } from "./data.store";

export class DataService {
  private unitaryUpdate<TKey extends keyof DataState>(
    key: TKey,
    val: DataState[TKey]
  ) {
    this.dataStore.update((state) => {
      return {
        ...state,
        [key]: val,
      };
    });
  }

  private simpleUpdate<TKey extends keyof DataState>(key: TKey) {
    return (val: DataState[TKey]) => this.unitaryUpdate(key, val);
  }

  public setInitialDateFilter = this.simpleUpdate("initialDateFilter");
  public setFinalDateFilter = this.simpleUpdate("finalDateFilter");
  public setSelectedCountry = this.simpleUpdate("selectedCountry");
  public setFilterYear = this.simpleUpdate("filterYears");
  public setSelectedNode = this.simpleUpdate("selectedNetworkNode");
  public setHoveredNetworkNode = this.simpleUpdate("hoveredNetworkNode");
  public setSelectedGeopoliticalGroup = this.simpleUpdate(
    "selectedGeopoliticalGroup"
  );
  public setSelectedNetworkGrouping = this.simpleUpdate(
    "selectedNetworkGrouping"
  );

  public setFilterEndpoint(endpoint: "start" | "end", val: number | null) {
    this.dataStore.update((state) => {
      return {
        ...state,
        filterYears: { ...state.filterYears, [endpoint]: val },
      };
    });
  }

  public recolorNode(id: NodeID, newColor: HexString) {
    this.dataStore.update((state) => {
      const mutableNodeLookup = {
        ...state.networkNodeRenderProps,
        [id]: {
          ...state.networkNodeRenderProps[id],
          color: newColor,
        },
      };

      return { ...state, networkNodeRenderProps: mutableNodeLookup };
    });
  }
  public async setNodesFromAdjMat(
    objAdjMat: ObjectAdjacencyMatrix<`${NodeID}`, 0 | 1>,
    { height, width }: { width: number; height: number }
  ) {
    const keys = [
      ...Object.keys(objAdjMat).map((keyStr) => Number.parseInt(keyStr)),
    ] as NodeID[];
    const adjMat = objAdjToAdj(objAdjMat);
    const placements = forceDirectedGraph({
      G: adjMat,
      iterations: 50,
      // for fine tuning params, static seed is helpful
      // seed: "Test",
      // edge_length: 40,
      H: NetworkStageSize.y,
      W: NetworkStageSize.x,
      offset: { x: -50, y: -20 },
      attractFac: 2,
      repulseFac: 2,
      wallFac: 7,
    });

    placements.forEach((placement, ii) => {
      this.moveNode(keys[ii], {
        x: Math.max(placement.x + 0 * width, 0) as KonvaSpace,
        y: Math.max(placement.y + 0 * height, 0) as KonvaSpace,
      });
    });
  }

  public moveNode(id: NodeID, newPosition: ObjV2<KonvaSpace>) {
    this.dataStore.update((state) => {
      const mutableNodeLookup = {
        ...state.networkNodeRenderProps,
        [id]: {
          ...state.networkNodeRenderProps[id],
          position: newPosition,
        },
      };

      return { ...state, networkNodeRenderProps: mutableNodeLookup };
    });
  }

  // TODO vscode snippet for akita

  // Cycles through colors
  public async colorNetworkByCommunity(
    adjMat: ObjectAdjacencyMatrix,
    colors: HexString[] = COLORS
  ) {
    const communities = detectConnectedComponentsFromAdjMat(adjMat);
    Object.keys(communities).forEach((communityKey) => {
      communities[
        Number.parseInt(communityKey) as keyof typeof communities
      ].forEach((country) => {
        this.recolorNode(
          Number.parseInt(country) as NodeID,
          colors[Number.parseInt(communityKey) % colors.length]
        );
      });
    });
  }

  public nudgeFilterEndpoint(endpoint: "start" | "end", val: number) {
    this.dataStore.update((state) => {
      return {
        ...state,
        filterYears: {
          ...state.filterYears,
          [endpoint]: state.filterYears[endpoint] || 0 + val,
        },
      };
    });
  }

  constructor(private dataStore: DataStore) {}
}

export const dataService = new DataService(dataStore);
