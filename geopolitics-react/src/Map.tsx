import {
  GeoJSON,
  LayerGroup,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { Capitals } from "./capitals";
import { CountryFiles } from "./countries";

import { countryInfo, Regions } from "./countryData";
import { ArrV2 } from "./types";
type CountryCode = (typeof countryInfo)[number]["alpha-3"];
const mapCountryData = (
  key: keyof (typeof countryInfo)[number],
  value: keyof (typeof countryInfo)[number]
) =>
  Object.fromEntries(
    countryInfo.map((country) => [country[key], country[value]])
  );

type BilateralRelation = { between: ArrV2<CountryCode>; strength: -1 | 1 };
export function WorldMap(): JSX.Element {
  const position = [40, -100] as ArrV2;
  const relations: BilateralRelation[] = [
    { between: ["CHN", "USA"], strength: -1 },
    { between: ["VEN", "RUS"], strength: 1 },
    { between: ["VEN", "CHN"], strength: 1 },
  ];
  const capitalCityPositionByCode = (code: CountryCode) =>
    Capitals[code]
      ? [...Capitals[code]["geometry"]["coordinates"]].reverse()
      : [0, 0];
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
      <div>
        <MapContainer
          style={{ width: "1080px", height: "780px" }}
          center={position}
          zoom={2}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {countries.map(([code, country]) => (
            <GeoJSON
              style={{ fillColor: regionColorMap[countryToRegion[code]] }}
              data={country}
            >
              <Popup>{countryToName[code]}</Popup>
            </GeoJSON>
          ))}
          <LayerGroup>
            {relations.map(({ between, strength }) => {
              return (
                <Polyline
                  positions={[
                    capitalCityPositionByCode(between[0]),
                    capitalCityPositionByCode(between[1]),
                  ]}
                  color={strength === 1 ? "green" : "red"}
                ></Polyline>
              );
            })}
          </LayerGroup>
        </MapContainer>
      </div>
    </>
  );
}
