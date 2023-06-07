import { useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { BilateralRelation, bilateralRelations } from "./bilateralRelations";
import { Capitals } from "./capitals";
import { CountryFiles } from "./countries";

import { countryInfo, Regions } from "./countryData";
import { ArrV2 } from "./types";
const mapCountryData = (
  key: keyof (typeof countryInfo)[number],
  value: keyof (typeof countryInfo)[number]
) =>
  Object.fromEntries(
    countryInfo.map((country) => [country[key], country[value]])
  );
function positionLine(partnerA: CountryCode, partnerB: CountryCode) {
  const simpleLine = [
    capitalCityPositionByCode(partnerA),
    capitalCityPositionByCode(partnerB),
  ];
  const xIndex = 1;
  if (Math.abs(simpleLine[0][xIndex] - simpleLine[1][xIndex]) > 180) {
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
type CountryCode = (typeof countryInfo)[number]["alpha-3"];
type CountryName = (typeof countryInfo)[number]["name"];
// type BilateralRelation = { between: ArrV2<CountryCode>; strength: -1 | 1 };

function AntimeridianSafePolyLine({
  connection: [partnerA, partnerB, strength],
}: {
  connection: BilateralRelation;
}): JSX.Element {
  return (
    <>
      {positionLine(partnerA, partnerB).map((line) => {
        return (
          <Polyline
            positions={line}
            color={strength === 1 ? "green" : "red"}
          ></Polyline>
        );
      })}
    </>
  );
}
const capitalCityPositionByCode = (code: CountryCode) => {
  if (!Capitals[code]) {
    return [0, 0];
  }

  const coords = [...Capitals[code]["geometry"]["coordinates"]].reverse();

  return coords;
};
export function MapContents(): JSX.Element {
  const [visibleRelations, setVisibleRelations] =
    useState<BilateralRelation[]>(bilateralRelations);
  useMapEvents({
    popupopen: ({ popup }) => {
      const visibleId = popup.options.children.props.id;
      console.log(
        "TEST123",
        // bilateralRelations,
        bilateralRelations.filter(
          ([a, b]) => a === visibleId || b === visibleId
        )
      );
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
  const countries = Object.entries(CountryFiles);
  const countryToRegion = mapCountryData("alpha-3", "region");
  const countryToName = mapCountryData("alpha-3", "name");
  const regionColorMap: Record<Regions, string> = {
    Africa: "green",
    Americas: "yellow",
    Antarctica: "white",
    Asia: "blue",
    Europe: "cyan",
    Oceania: "red",
  };
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {countries.map(([code, country]) => (
        // TODO weird tiling? Vectormap
        <GeoJSON
          style={{ fillColor: regionColorMap[countryToRegion[code]] }}
          data={country}
        >
          <Popup>
            <div id={code}>{countryToName[code]}</div>
          </Popup>
        </GeoJSON>
      ))}
      {/* <LayerGroup> */}
      {/* TODO hide irrelevant connections when a country is selected */}
      {/* TODO dont have lines stretch over half the map? */}
      {visibleRelations.map((connection) => {
        return (
          <AntimeridianSafePolyLine
            connection={connection}
          ></AntimeridianSafePolyLine>
        );
      })}
      {/* </LayerGroup> */}
    </>
  );
}
export function WorldMap(): JSX.Element {
  const position = [0, 0] as ArrV2;

  return (
    <>
      <div>
        <MapContainer
          style={{ width: "1020px", height: "780px" }}
          center={position}
          zoom={2}
          scrollWheelZoom={false}
          maxBoundsViscosity={1}
        >
          <MapContents />
        </MapContainer>
      </div>
    </>
  );
}
const makeGoogleNewsFeedUrl = (countryNameUrlSafe: string) =>
  `https://news.google.com/search?q=${countryNameUrlSafe}`;
