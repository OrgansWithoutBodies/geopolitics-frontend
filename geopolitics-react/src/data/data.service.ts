import type { KonvaSpace, ObjV2 } from "type-library/src";
import { NodeID, TimeSpace } from "../types";
import { CountryID, DataStore, dataStore } from "./data.store";

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

  public moveNode(id: NodeID, newPosition: ObjV2<KonvaSpace>) {
    this.dataStore.update((state) => {
      const mutableNodeLookup = {
        ...state.networkNodes,
        [id]: {
          ...state.networkNodes[id],
          renderedProps: { position: newPosition },
        },
      };

      return { ...state, networkNodes: mutableNodeLookup };
    });
  }

  constructor(private dataStore: DataStore) {}
}

export const dataService = new DataService(dataStore);
