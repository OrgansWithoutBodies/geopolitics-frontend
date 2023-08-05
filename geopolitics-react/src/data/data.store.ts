import { Store } from "@datorama/akita";
import { HistoricalEvent, NetworkNode } from "react-konva-components/src";
import { BrandedNumber, KonvaSpace } from "type-library";
import { NetworkNodeRenderProps } from "type-library/src";
import { CountryOutlines } from "../../dataPrep/out/countries";
import { WDType as WDCountry } from "../../dataPrep/out/countries.data";
import { QCodes as WDCountryQCodes } from "../../dataPrep/out/countries.qcodes.data";
import { WDType as WDInternationalOrg } from "../../dataPrep/out/internationalOrganizations.data";
import { QCodes as WDInternationalOrgQCodes } from "../../dataPrep/out/internationalOrganizations.qcodes.data";
import { WDType as WDTradeBlocs } from "../../dataPrep/out/tradeBlocs.data";
import { QCodes as WDTradeBlocsQCodes } from "../../dataPrep/out/tradeBlocs.qcodes.data";
import { WDType as WDWar } from "../../dataPrep/out/wars.data";
import { QCodes as WDWarQCodes } from "../../dataPrep/out/wars.qcodes.data";
import type { NodeID, TimeSpace } from "../types";

export type NodeLookup = Record<NodeID, NetworkNode>;
export type QCode<TNumber extends number = number> = `Q${TNumber}`;

export type CountryID = BrandedNumber<"CountryID">;
export interface DataState {
  events: HistoricalEvent[];
  initialDateFilter: TimeSpace | null;
  finalDateFilter: TimeSpace | null;
  internationalOrgs: typeof WDInternationalOrg;
  selectedCountry: CountryID | null;
  selectedNetworkNode: NodeID | null;
  filterYears: Record<"start" | "end", number | null>;
  internationalOrgsQCodes: typeof WDInternationalOrgQCodes;
  wars: typeof WDWar;
  warsQCodes: typeof WDWarQCodes;
  networkNodeRenderProps: Record<NodeID, NetworkNodeRenderProps>;
  tradeBlocs: typeof WDTradeBlocs;
  tradeBlocsQCodes: typeof WDTradeBlocsQCodes;

  countries: typeof WDCountry;
  countriesQCodes: typeof WDCountryQCodes;
  countriesOutlines: typeof CountryOutlines;
}

// TODO persist
export function createInitialState(): DataState {
  return {
    filterYears: { start: null, end: null },
    networkNodeRenderProps: Object.fromEntries(
      [
        ...new Set(WDTradeBlocs.map((bloc) => bloc.memberState.value).flat()),
      ].map((country) => [
        numericalQCode({ item: { value: country } }) as NodeID,
        {
          color: "#FF0000",
          position: {
            x: (Math.random() * 400) as KonvaSpace,
            y: (Math.random() * 700) as KonvaSpace,
          },
        },
      ])
    ),
    selectedNetworkNode: null,
    selectedCountry: null,
    internationalOrgs: WDInternationalOrg,
    internationalOrgsQCodes: WDInternationalOrgQCodes,
    wars: WDWar,
    warsQCodes: WDWarQCodes,
    countries: WDCountry,
    countriesQCodes: WDCountryQCodes,
    countriesOutlines: CountryOutlines,
    tradeBlocs: WDTradeBlocs,
    tradeBlocsQCodes: WDTradeBlocsQCodes,
    events: [],
    initialDateFilter: null,
    finalDateFilter: null,
  };
}
//! TODO
// @StoreConfig({ name: "data" })
export class DataStore extends Store<DataState> {
  constructor() {
    super(createInitialState());
  }
}

export const dataStore = new DataStore();
export function numericalQCode<TNum extends number>(country: {
  item: { value: `Q${TNum}` };
}): TNum {
  return Number.parseInt(country.item.value.replace("Q", "")) as TNum;
}
