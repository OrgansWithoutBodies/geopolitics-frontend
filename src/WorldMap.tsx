import { useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { BilateralRelation } from "./bilateralRelations";
import {
  CountryCode,
  CountryHeartMap,
  CountryNameLookup,
  CountryRegionLookup,
  GeoJsonGeometryGeneric,
  LonLat,
  RegionColorMap,
} from "./mapTypes";
import { ArrV2, ObjV2 } from "./types";
// TODO filter by strength
function positionLine(
  partnerA: CountryCode,
  partnerB: CountryCode,
  countryHeartMap: CountryHeartMap
): LonLat[][] {
  const simpleLine = [
    capitalCityPositionByCode(partnerA, countryHeartMap),
    capitalCityPositionByCode(partnerB, countryHeartMap),
  ];
  const xIndex = 1;
  if (Math.abs(simpleLine[0][xIndex] - simpleLine[1][xIndex]) > 160) {
    const rightmostIndex =
      simpleLine[0][xIndex] > simpleLine[1][xIndex] ? 0 : 1;
    const rightmostPoint = simpleLine[rightmostIndex];
    const leftmostPoint = simpleLine[1 - rightmostIndex];

    const run = simpleLine[0][xIndex] - simpleLine[1][xIndex];
    const rise = simpleLine[0][1 - xIndex] - simpleLine[1][1 - xIndex];
    const slope = rise / run;

    const rightmostDistFromAntimeridian = 180 - rightmostPoint[xIndex];
    const deltaRise = rightmostDistFromAntimeridian * slope;
    const rightSideAntimeridianIntersection = [
      rightmostPoint[1 - xIndex] - deltaRise,
      180,
    ];
    const leftSideAntimeridianIntersection = [
      rightmostPoint[1 - xIndex] - deltaRise,
      -180,
    ];
    // console.log(rightmostPoint[1] + deltaRise, rightmostPoint, rise, run);
    return [
      [rightmostPoint, rightSideAntimeridianIntersection],
      [leftSideAntimeridianIntersection, leftmostPoint],
    ];
  }
  return [simpleLine];
}

function AntimeridianSafePolyLine({
  connection: [partnerA, partnerB, strength],
  countryHeartMap,
}: {
  connection: BilateralRelation;
  countryHeartMap: CountryHeartMap;
}): JSX.Element {
  const color = strength === 1 ? "green" : strength === 0 ? "black" : "red";
  return (
    <>
      {positionLine(partnerA, partnerB, countryHeartMap).map((line, ii) => {
        return (
          <Polyline
            key={`${partnerA}-${partnerB}-${ii}`}
            positions={line}
            color={color}
          ></Polyline>
        );
      })}
    </>
  );
}
const capitalCityPositionByCode = (
  code: CountryCode,
  countryHeartMap: CountryHeartMap
) => {
  const coords = [
    // spread to avoid mutation
    ...countryHeartMap[code]["geometry"]["coordinates"],
  ].reverse() as LonLat;

  return coords;
};
type MapContentsType<TCountryLiterals extends string> = {
  countries: { geometry: GeoJsonGeometryGeneric; key: TCountryLiterals }[];
  countryToRegion: CountryRegionLookup<TCountryLiterals>;
  countryToName: CountryNameLookup<TCountryLiterals>;
  regionColorMap?: RegionColorMap;
  bilateralRelations?: BilateralRelation[];
  countryHeartMap?: CountryHeartMap;
};

export function MapContents<TCountryLiterals extends string>({
  bilateralRelations,
  countries,
  regionColorMap,
  countryHeartMap,
  countryToName,
  countryToRegion,
}: MapContentsType<TCountryLiterals>): JSX.Element {
  const [visibleRelations, setVisibleRelations] = useState<
    BilateralRelation[] | undefined
  >(bilateralRelations);
  useMapEvents({
    popupopen: ({ popup }) => {
      const visibleId = popup.options.children.props.id;
      if (!bilateralRelations) {
        return;
      }
      setVisibleRelations(
        bilateralRelations.filter(
          ([a, b]) => a === visibleId || b === visibleId
        )
      );
    },
    popupclose: () => {
      setVisibleRelations(bilateralRelations);
    },
  });

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {countries.map(({ key, geometry }) => (
        // TODO weird tiling? Vectormap
        <GeoJSON
          key={`geo-${key}`}
          style={{
            fillColor: regionColorMap
              ? regionColorMap[countryToRegion[key]]
              : "white",
          }}
          data={geometry}
        >
          <Popup>
            <div id={key}>{countryToName[key]}</div>
          </Popup>
        </GeoJSON>
      ))}
      {/* <LayerGroup> */}
      {/* TODO hide irrelevant connections when a country is selected */}
      {/* TODO dont have lines stretch over half the map? */}
      {visibleRelations &&
        countryHeartMap &&
        visibleRelations.map((connection) => {
          return (
            <AntimeridianSafePolyLine
              countryHeartMap={countryHeartMap}
              connection={connection}
            ></AntimeridianSafePolyLine>
          );
        })}
      {/* </LayerGroup> */}
    </>
  );
}
export function WorldMap<TCountryLiterals extends string>({
  contents,
  container: {
    center,
    sizePx: { x: width, y: height },
  },
}: {
  container: { sizePx: ObjV2; center: ArrV2 };
  contents: MapContentsType<TCountryLiterals>;
}): JSX.Element {
  return (
    <>
      <MapContainer
        // style={{ width: "1024px", height: "780px" }}
        style={{ height: `${height}px`, width: `${width}px` }}
        center={center}
        zoom={2}
        scrollWheelZoom={true}
        // maxBoundsViscosity={1}
      >
        <MapContents {...contents} />
      </MapContainer>
    </>
  );
}
const makeGoogleNewsFeedUrl = (countryNameUrlSafe: string) =>
  `https://news.google.com/search?q=${countryNameUrlSafe}`;
