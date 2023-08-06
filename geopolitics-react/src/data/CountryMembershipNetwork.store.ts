import { Store, StoreConfig } from "@datorama/akita";
import { NetworkNode } from "react-konva-components/src";
import { BrandedNumber, KonvaSpace } from "type-library";
import { NetworkNodeRenderProps, NodeID } from "type-library/src";

export type NodeLookup = Record<NodeID, NetworkNode>;
export type QCode<TNumber extends number = number> = `Q${TNumber}`;

export type CountryID = BrandedNumber<"CountryID">;
export interface CountryMembershipNetworkState {
  selectedNetworkNode: NodeID | null;
  networkNodeRenderProps: Record<NodeID, NetworkNodeRenderProps>;
}
export function createInitialState(
  data: { memberState: { value: QCode<NodeID> } }[]
): CountryMembershipNetworkState {
  return {
    networkNodeRenderProps: Object.fromEntries(
      [...new Set(data.map((bloc) => bloc.memberState.value).flat())].map(
        (country) => [
          numericalQCode({ item: { value: country } }) as NodeID,
          {
            color: "#FF0000",
            position: {
              x: 0 as KonvaSpace,
              y: 0 as KonvaSpace,
            },
          },
        ]
      )
    ),
    selectedNetworkNode: null,
  };
}
@StoreConfig({ name: "CountryMembershipNetwork" })
export class CountryMembershipNetworkStore extends Store<CountryMembershipNetworkState> {
  constructor(data: { memberState: { value: QCode<NodeID> } }[]) {
    super(createInitialState(data));
  }
}

// export const dataStore = new DataStore();
export function numericalQCode<TNum extends number>(country: {
  item: { value: `Q${TNum}` };
}): TNum {
  return Number.parseInt(country.item.value.replace("Q", "")) as TNum;
}
