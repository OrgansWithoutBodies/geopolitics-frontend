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
import { TimeSpace } from "../types";
import { COLORS } from "./COLORS";
import { CountryID, DataState, DataStore, dataStore } from "./data.store";

export class DataService {
  public setInitialDateFilter(initialDateFilter: TimeSpace | null) {
    this.dataStore.update((state) => {
      return {
        ...state,
        initialDateFilter,
      };
    });
  }
  public setFinalDateFilter(finalDateFilter: TimeSpace | null) {
    this.dataStore.update((state) => {
      return {
        ...state,
        finalDateFilter,
      };
    });
  }
  public setSelectedCountry(countryID: CountryID) {
    this.dataStore.update((state) => {
      return {
        ...state,
        selectedCountry: countryID,
      };
    });
  }
  public setFilterYear(filterYears: Record<"start" | "end", number | null>) {
    this.dataStore.update((state) => {
      return {
        ...state,
        filterYears,
      };
    });
  }
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
          // renderedProps: {  },
        },
      };

      return { ...state, networkNodeRenderProps: mutableNodeLookup };
    });
  }
  public setSelectedNode(nodeID: NodeID) {
    this.dataStore.update((state) => {
      return { ...state, selectedNetworkNode: nodeID };
    });
  }
  public setHoveredNetworkNode(nodeID: NodeID) {
    this.dataStore.update((state) => {
      return { ...state, hoveredNetworkNode: nodeID };
    });
  }
  public setSelectedGeopoliticalGroup(
    group: DataState["selectedGeopoliticalGroup"]
  ) {
    console.log("TEST123-group", group);
    this.dataStore.update((state) => {
      return { ...state, selectedGeopoliticalGroup: group };
    });
  }
  public setNodesFromAdjMat(
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
      // this.recolorNode(keys[ii], getRandomColor());
    });
  }

  public moveNode(id: NodeID, newPosition: ObjV2<KonvaSpace>) {
    this.dataStore.update((state) => {
      // console.log("TEST123-MOVENODE", id, state.networkNodeRenderProps[id]);
      const mutableNodeLookup = {
        ...state.networkNodeRenderProps,
        [id]: {
          ...state.networkNodeRenderProps[id],
          position: newPosition,
          // renderedProps: {  },
        },
      };

      return { ...state, networkNodeRenderProps: mutableNodeLookup };
    });
  }

  // TODO vscode snippet
  // public colorNetworkByCommunity(colors:HexString[]=COLORS){
  //   this.dataStore.update((state)=>{
  //     return {
  //       ...state,
  //     }
  //   })
  // }

  // Cycles through colors
  public colorNetworkByCommunity(
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
    // this.dataStore.update((state)=>{
    //   return {
    //     ...state,
    //   }
    // })
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
