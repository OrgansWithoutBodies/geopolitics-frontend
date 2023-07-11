import { GeoJsonGeometryPoint } from "react-konva-components/src";
import { Capitals } from "../out/capitals";
import { countryInfo } from "../out/countryData";
import { CShapes } from "../out/cshapes";

export type Country = (typeof countryInfo)[number]["name"];
export type Regions = (typeof countryInfo)[number]["region"];
export type SubRegions = (typeof countryInfo)[number]["sub-region"];
export type IntermediateRegions =
  (typeof countryInfo)[number]["intermediate-region"];

// type RegionString = BrandedString<'Region'>
export type RegionColorMap = Record<Regions, string>;
export type CountryInfoKey = keyof (typeof countryInfo)[number];

export type CountryCode = (typeof countryInfo)[number]["alpha-3"];
export type CountryName = (typeof countryInfo)[number]["name"];
export type CountryRegionLookup<TCountryLiterals extends string> = {
  [key in TCountryLiterals]: Regions;
};
export type CountryNameLookup<TCountryLiterals extends string> = {
  [key in TCountryLiterals]: Regions;
};

export type CapitalCityCountryCodes = keyof typeof Capitals;
export type CountryHeartMap = Record<CountryCode, GeoJsonGeometryPoint>;

// type CapitalProps = (typeof Capitals)[CapitalCityCountryCodes]["properties"];

export type CShapesType = (typeof CShapes)["features"][number];
