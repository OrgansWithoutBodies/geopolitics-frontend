import { Store, StoreConfig } from "@datorama/akita";
import { HistoricalEvent, NetworkNode } from "react-konva-components/src";
import { BrandedNumber, KonvaSpace, NodeID } from "type-library";
import { NetworkNodeRenderProps } from "type-library/src";
import { CountryOutlines } from "../../dataPrep/out/countries";
import { WDType as WDCountry } from "../../dataPrep/out/countries.data";
import { QCodes as WDCountryQCodes } from "../../dataPrep/out/countries.qcodes.data";
// import { CountryOutlines as DisputedTerritoryOutlines } from "../../dataPrep/out/disputedTerritories";
// import { CountryOutlines as LimitedRecognitionStatesOutlines } from "../../dataPrep/out/limitedRecognitionStates";
import { WDType as WDGeopoliticalGroups } from "../../dataPrep/out/geopoliticalGroups.data";
import { QCodes as WDGeopoliticalGroupsQCodes } from "../../dataPrep/out/geopoliticalGroups.qcodes.data";
import { WDType as WDIntergovernmentalOrg } from "../../dataPrep/out/intergovernmentalOrganizations.data";
import { QCodes as WDIntergovernmentalOrgQCodes } from "../../dataPrep/out/intergovernmentalOrganizations.qcodes.data";
// import { WDType as WDDisputedTerritories } from "../../dataPrep/out/disputedTerritories.data";
// import { QCodes as WDDisputedTerritoriesQCodes } from "../../dataPrep/out/disputedTerritories.qcodes.data";
import { WDType as WDInternationalOrg } from "../../dataPrep/out/internationalOrganizations.data";
import { QCodes as WDInternationalOrgQCodes } from "../../dataPrep/out/internationalOrganizations.qcodes.data";
// import { WDType as WDLimitedRecognitionStates } from "../../dataPrep/out/limitedRecognitionStates.data";
// import { QCodes as WDLimitedRecognitionStatesQCodes } from "../../dataPrep/out/limitedRecognitionStates.qcodes.data";
import { WDType as WDTradeBlocs } from "../../dataPrep/out/tradeBlocs.data";
import { QCodes as WDTradeBlocsQCodes } from "../../dataPrep/out/tradeBlocs.qcodes.data";
import { WDType as WDWar } from "../../dataPrep/out/wars.data";
import { QCodes as WDWarQCodes } from "../../dataPrep/out/wars.qcodes.data";
import type { TimeSpace } from "../types";

export type NodeLookup = Record<NodeID, NetworkNode>;
export type QCode<TNumber extends number = number> = `Q${TNumber}`;
export type PCode<TNumber extends number = number> = `P${TNumber}`;

export type CountryID = BrandedNumber<"CountryID">;
type TimeStamp<
  TY extends number = number,
  TMon extends number = number,
  TD extends number = number,
  TH extends number = number,
  TMin extends number = number,
  TS extends number = number
> = `${TY}-${TMon}-${TD}T${TH}:${TMin}:${TS}Z`;

type CountryType = {
  item: { type: "uri"; value: QCode<CountryID> };
  shape: {
    type: "uri";
    value: `http://commons.wikimedia.org/data/main/Data:${string}.map`;
  };
  stateStart: {
    datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
    type: "literal";
    value: TimeStamp;
  };
  center: {
    datatype: "http://www.opengis.net/ont/geosparql#wktLiteral";
    type: "literal";
    value: `Point(${number} ${number})`;
  };
  stateEnd: {
    datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
    type: "literal";
    value: TimeStamp;
  };
};
export interface DataState {
  events: HistoricalEvent[];
  initialDateFilter: TimeSpace | null;
  finalDateFilter: TimeSpace | null;
  selectedCountry: CountryID | null;
  selectedNetworkNode: NodeID | null;
  filterYears: Record<"start" | "end", number | null>;
  internationalOrgs: typeof WDInternationalOrg;
  internationalOrgsQCodes: typeof WDInternationalOrgQCodes;
  intergovernmentalOrgs: typeof WDIntergovernmentalOrg;
  intergovernmentalOrgsQCodes: typeof WDIntergovernmentalOrgQCodes;
  wars: typeof WDWar;
  warsQCodes: typeof WDWarQCodes;
  networkNodeRenderProps: Record<NodeID, NetworkNodeRenderProps>;
  tradeBlocs: typeof WDTradeBlocs;
  selectedGeopoliticalGroup:
    | (typeof WDTradeBlocs)[number]["item"]["value"]
    | null;
  tradeBlocsQCodes: typeof WDTradeBlocsQCodes;

  countries: CountryType[];
  geopoliticalGroups: typeof WDGeopoliticalGroups;
  geopoliticalGroupsQCodes: typeof WDGeopoliticalGroupsQCodes;
  countriesQCodes: Record<
    QCode<CountryID>,
    (typeof WDCountryQCodes)[keyof typeof WDCountryQCodes]
  >;
  countriesOutlines: Record<
    QCode<CountryID>,
    | {
        type: string;
        features: {
          type: string;
          properties: {
            ADMIN: string;
            ISO_A3: string;
          };
          geometry: {
            type: "MultiPolygon";
            coordinates: number[][][][];
          };
        }[];
      }
    | {
        type: string;
        features: {
          type: string;
          properties: {
            ADMIN: string;
            ISO_A3: string;
          };
          geometry: {
            type: "Polygon";
            coordinates: number[][][];
          };
        }[];
      }
  >;
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
            x: (Math.random() * 10) as KonvaSpace,
            y: (Math.random() * 10) as KonvaSpace,
          },
        },
      ])
    ),
    geopoliticalGroups: WDGeopoliticalGroups,
    geopoliticalGroupsQCodes: WDGeopoliticalGroupsQCodes,
    selectedNetworkNode: null,
    selectedCountry: null,
    internationalOrgs: WDInternationalOrg,
    internationalOrgsQCodes: WDInternationalOrgQCodes,
    intergovernmentalOrgs: WDIntergovernmentalOrg,
    intergovernmentalOrgsQCodes: WDIntergovernmentalOrgQCodes,
    wars: WDWar,
    warsQCodes: WDWarQCodes,
    countries: [
      ...new Set([
        ...(WDCountry as any as Readonly<CountryType[]>),
        // ...(WDDependentTerritories as any as Readonly<CountryType[]>),
        // ...(WDDisputedTerritories as any as Readonly<CountryType[]>),
        // ...(WDLimitedRecognitionStates as any as Readonly<CountryType[]>),
      ]),
    ],
    countriesQCodes: {
      ...WDCountryQCodes,
      // ...WDDependentTerritoriesQCodes,
      // ...WDDisputedTerritoriesQCodes,
      // ...WDLimitedRecognitionStatesQCodes,
    } as any,
    countriesOutlines: {
      ...CountryOutlines,
      // ...DependentTerritoryOutlines,
      // ...DisputedTerritoryOutlines,
      // ...LimitedRecognitionStatesOutlines,
    } as any,
    tradeBlocs: WDTradeBlocs,
    selectedGeopoliticalGroup: null,
    tradeBlocsQCodes: WDTradeBlocsQCodes,
    events: [],
    initialDateFilter: null,
    finalDateFilter: null,
  };
}
@StoreConfig({ name: "data" })
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
