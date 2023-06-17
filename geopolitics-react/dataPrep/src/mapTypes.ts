import { Capitals } from "./capitals";
import { countryInfo } from "./countryData";
import { CShapes } from "./cshapes";
type GeoJsonTypes =
  | "Point"
  | "Polygon"
  | "FeatureCollection"
  | "Feature"
  | "MultiPolygon"
  | "LineString"
  | "MultiLineString"
  | "MultiPoint"
  | "GeometryCollection";
// NA: {
//   properties: {
//     country: "Asia &amp; Pacific",
//     tld: "asia",
//     iso2: "AP",
//   },
//   geometry: {
//     coordinates: [0, 0],
//     type: "Point",
//   },
//   id: "AP",
// },
// TODO 'Conflict Zone'/Disputed territory
export type LatLon = [lat: number, lon: number];
export type LonLat = [lon: number, lat: number];
export type GeoJsonGeometryGeneric<
  TType extends GeoJsonTypes = GeoJsonTypes,
  TCoord = any
> = {
  geometry: { type: TType; coordinates: TCoord };
};
export type GeoJsonGeometryPolygon = GeoJsonGeometryGeneric<
  "Polygon",
  LatLon[][]
>;
export type GeoJsonGeometryPoint = GeoJsonGeometryGeneric<
  "Point",
  LatLon | Readonly<[number, number]>
>;

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

// export type CapitalCityName = keyof CapitalProps extends "city"
//   ? CapitalProps["city"]
//   : "";
export type CShapesType = (typeof CShapes)["features"][number];
