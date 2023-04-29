import { TimeSpace } from "../types";
import { dataStore, DataStore } from "./data.store";

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
  constructor(private dataStore: DataStore) {}
}

export const dataService = new DataService(dataStore);
