import { Store, StoreConfig } from "@datorama/akita";
import {
  GeoJsonMultiPolygon,
  GeoJsonPolygon,
  HistoricalEvent,
  NetworkNode,
} from "react-konva-components/src";
import { BrandedNumber, NodeID } from "type-library";
import { NetworkNodeRenderProps } from "type-library/src";
import { CountryOutlines } from "../../dataPrep/out/countries";
import { WDType as WDCountry } from "../../dataPrep/out/countries.data";
import { QCodes as WDCountryQCodes } from "../../dataPrep/out/countries.qcodes.data";
import { CountryOutlines as DependentTerritoriesOutlines } from "../../dataPrep/out/dependentTerritories";
import { WDType as WDDependentTerritories } from "../../dataPrep/out/dependentTerritories.data";
import { QCodes as WDDependentTerritoriesQCodes } from "../../dataPrep/out/dependentTerritories.qcodes.data";
import { CountryOutlines as DisputedTerritoryOutlines } from "../../dataPrep/out/disputedTerritories";
import { WDType as WDDisputedTerritories } from "../../dataPrep/out/disputedTerritories.data";
import { QCodes as WDDisputedTerritoriesQCodes } from "../../dataPrep/out/disputedTerritories.qcodes.data";
import { WDType as WDGeopoliticalGroups } from "../../dataPrep/out/geopoliticalGroups.data";
import { QCodes as WDGeopoliticalGroupsQCodes } from "../../dataPrep/out/geopoliticalGroups.qcodes.data";
import { WDType as WDIntergovernmentalOrg } from "../../dataPrep/out/intergovernmentalOrganizations.data";
import { QCodes as WDIntergovernmentalOrgQCodes } from "../../dataPrep/out/intergovernmentalOrganizations.qcodes.data";
import { WDType as WDInternationalOrg } from "../../dataPrep/out/internationalOrganizations.data";
import { QCodes as WDInternationalOrgQCodes } from "../../dataPrep/out/internationalOrganizations.qcodes.data";
import { CountryOutlines as LimitedRecognitionStatesOutlines } from "../../dataPrep/out/limitedRecognitionStates";
import { WDType as WDLimitedRecognitionStates } from "../../dataPrep/out/limitedRecognitionStates.data";
import { QCodes as WDLimitedRecognitionStatesQCodes } from "../../dataPrep/out/limitedRecognitionStates.qcodes.data";
import { WDType as WDTradeBlocs } from "../../dataPrep/out/tradeBlocs.data";
import { QCodes as WDTradeBlocsQCodes } from "../../dataPrep/out/tradeBlocs.qcodes.data";
// import { WDType as WDWar } from "../../dataPrep/out/wars.data";
// import { QCodes as WDWarQCodes } from "../../dataPrep/out/wars.qcodes.data";
import {
  WDEntryDateTime,
  WDEntryGeoShape,
  WDEntryLatLng,
  WDEntryQCode,
} from "../../dataPrep/src/buildQuery";
import type { TimeSpace } from "../types";
import { BlocID } from "./data.query";

export type NodeLookup = Record<NodeID, NetworkNode>;
export type QCode<TNumber extends number = number> = `Q${TNumber}`;
export type PCode<TNumber extends number = number> = `P${TNumber}`;

export type CountryID = BrandedNumber<"CountryID">;
export type GroupID = BrandedNumber<"GroupID">;
export type MetaGroupID = BrandedNumber<"MetaGroupID">;
export type MembershipStatusID = BrandedNumber<"MembershipStatusID">;

export interface WDType<TCode extends number = number> {
  item: WDEntryQCode<TCode>;
}
export interface CountryType extends WDType<CountryID> {
  shape: WDEntryGeoShape;
  center: WDEntryLatLng;
  stateStart: WDEntryDateTime;
  stateEnd: WDEntryDateTime;
}

export interface MultilateralOrgType extends WDType<GroupID> {
  memberState: WDEntryQCode<CountryID>;
  membershipStatus?: WDEntryQCode<MembershipStatusID>;
}
export enum MetaGrouping {
  TRADE_BLOCS = "Trade Blocs",
  GEOPOLITICAL_GROUPS = "Geopolitical Groups",
  INTERNATIONAL_ORGANIZATIONS = "International Organizations (Slower)",
  INTERGOVERNMENTAL_ORGANIZATIONS = "Intergovernmental Organizations (Slower)",
}
export interface DataState {
  filterYears: Record<"start" | "end", number | null>;
  initialDateFilter: TimeSpace | null;
  finalDateFilter: TimeSpace | null;
  events: HistoricalEvent[];

  selectedCountry: CountryID | null;
  selectedNetworkNode: NodeID | null;
  hoveredNetworkNode: NodeID | null;
  selectedGeopoliticalGroup: GroupID | null;
  selectedNetworkGrouping: MetaGrouping;
  // wars: typeof WDWar;
  // warsQCodes: typeof WDWarQCodes;
  networkNodeRenderProps: Record<NodeID, NetworkNodeRenderProps> | null;

  internationalOrgs: Readonly<MultilateralOrgType[]>;
  intergovernmentalOrgs: Readonly<MultilateralOrgType[]>;
  tradeBlocs: Readonly<MultilateralOrgType[]>;
  geopoliticalGroups: Readonly<MultilateralOrgType[]>;

  internationalOrgsQCodes: typeof WDInternationalOrgQCodes;
  intergovernmentalOrgsQCodes: typeof WDIntergovernmentalOrgQCodes;
  tradeBlocsQCodes: Record<
    QCode<BlocID>,
    (typeof WDTradeBlocsQCodes)[keyof typeof WDTradeBlocsQCodes]
  >;
  geopoliticalGroupsQCodes: typeof WDGeopoliticalGroupsQCodes;

  countries: CountryType[];
  countriesQCodes: Record<
    QCode<CountryID>,
    (typeof WDCountryQCodes)[keyof typeof WDCountryQCodes]
  >;
  countriesOutlines: Record<
    QCode<CountryID>,
    GeoJsonMultiPolygon | GeoJsonPolygon
  >;
}

// TODO persist
export function createInitialState(): DataState {
  return {
    hoveredNetworkNode: null,
    initialDateFilter: null,
    finalDateFilter: null,
    filterYears: { start: null, end: null },

    networkNodeRenderProps: null,

    selectedNetworkNode: null,
    selectedNetworkGrouping: MetaGrouping.TRADE_BLOCS,
    selectedCountry: null,
    selectedGeopoliticalGroup: null,

    tradeBlocs: WDTradeBlocs as any,
    geopoliticalGroups: WDGeopoliticalGroups as any,
    internationalOrgs: WDInternationalOrg as any,
    intergovernmentalOrgs: WDIntergovernmentalOrg as any,

    geopoliticalGroupsQCodes: WDGeopoliticalGroupsQCodes,
    internationalOrgsQCodes: WDInternationalOrgQCodes,
    intergovernmentalOrgsQCodes: WDIntergovernmentalOrgQCodes,
    tradeBlocsQCodes: WDTradeBlocsQCodes,
    // wars: WDWar,
    // warsQCodes: WDWarQCodes,
    countries: [
      ...new Set([
        ...(WDCountry as any),
        ...(WDDependentTerritories as any),
        ...(WDDisputedTerritories as any),
        ...(WDLimitedRecognitionStates as any),
      ]),
    ],
    countriesQCodes: {
      ...WDCountryQCodes,
      ...WDDependentTerritoriesQCodes,
      ...WDDisputedTerritoriesQCodes,
      ...WDLimitedRecognitionStatesQCodes,
    } as any,
    countriesOutlines: {
      ...CountryOutlines,
      ...DependentTerritoriesOutlines,
      ...DisputedTerritoryOutlines,
      ...LimitedRecognitionStatesOutlines,
    } as any,
    events: [],
  };
}
@StoreConfig({ name: "data" })
export class DataStore extends Store<DataState> {
  constructor() {
    super(createInitialState());
  }
}

export const dataStore = new DataStore();
