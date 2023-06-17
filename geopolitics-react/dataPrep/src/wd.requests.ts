import axios, { HttpStatusCode } from "axios";
import { array, object, Struct } from "superstruct";
import {
  CodeURI,
  DBResults2NF,
  JoinStringArray,
  MapArrayOp,
  QCode,
  QueryString,
  QueryValueSpec,
  ReturnValKey,
  WDPoliticalPartyDBEntry,
} from "./wd.types";

const url = "https://query.wikidata.org/sparql?flavor=dump";
const INSTANCE_OF = "P31" as const;
const COORDINATE_LOCATION = "P625" as const;

const unMemberStates = `
#UN member states
SELECT DISTINCT ?state  WHERE {
  ?state wdt:${INSTANCE_OF}/wdt:P279* wd:Q3624078;
         p:P463 ?memberOfStatement.
  ?memberOfStatement a wikibase:BestRank;
                     ps:P463 wd:Q1065.
  MINUS { ?memberOfStatement pq:P582 ?endTime. }
  MINUS { ?state wdt:P576|wdt:P582 ?end. }
}` as const;
const hospitals = `
SELECT DISTINCT ?item ?coord WHERE {
  ?item wdt:${INSTANCE_OF}/wdt:P279* wd:Q16917;
        wdt:${COORDINATE_LOCATION}?coord .
}` as const;
const minerals = `
SELECT DISTINCT ? WHERE {
  ?item wdt:${INSTANCE_OF} wd:Q889659;
}` as const;
const mines = `SELECT ?item ?country ?coord ?produces
WHERE {
    ?item wdt:${INSTANCE_OF} wd:Q820477.
    ?item wdt:P17 ?country.
    ?item wdt:${COORDINATE_LOCATION}?coord.
    ?item wdt:P1056 ?produces.
}
` as const;

const militaryAlliances = `
SELECT ?item ?itemLabel 
WHERE {
    ?item wdt:${INSTANCE_OF} wd:Q1127126.
}` as const;
const query = `
SELECT DISTINCT ?item ?title ?seats ?jurisdiction (YEAR(?inception) AS ?start) (YEAR(?dissolution) AS ?end)
WHERE
{
  ?item wdt:${INSTANCE_OF}/wdt:P279* wd:Q1752346 .
  OPTIONAL { ?item wdt:P1342 ?seats . }
  OPTIONAL {
    ?item wdt:P1001 ?j .
    ?j rdfs:label ?jurisdiction FILTER (lang(?jurisdiction) = "en") .
  }
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P576 ?dissolution . }
  OPTIONAL { ?item rdfs:label ?title FILTER (lang(?title) = "en") . }
}
ORDER BY DESC(?seats) ?title
` as const;
const parties = `
SELECT ?item ?country ?ideology ?start ?end
WHERE {
    ?item wdt:${INSTANCE_OF} wd:Q7278.
    ?item wdt:P17 ?country.
    OPTIONAL{?item wdt:P1142 ?ideology}
    OPTIONAL{?item wdt:P571 ?start}
    OPTIONAL{?item wdt:P576 ?end}
}
` as const;

// TODO map query to result validator
// r = requests.get(url, params = {'format': 'json', 'query': query})
// data = r.json()
const instanceOfQuery = () => {
  return ``;
};

function buildQueryString<
  TRefs extends DBResults2NF,
  TKeys extends readonly string[],
  TValueKey extends `wd:Q${number}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends {
    [key in keyof TRefs]?:
      | QueryValueSpec<
          string,
          `P${number}`,
          `wd:Q${number}` | ReturnValKey<keyof TRefs>,
          boolean,
          "."
        >
      | undefined;
  }
>(
  // TODO make this needed?
  refList: TRefs,
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: TValueMaps
): QueryString<TRefs, TKeys, TValueKey, TValueMaps> {
  const returnKeys = keyList
    .map((key) => `?${String(key)}`)
    .join(" ") as JoinStringArray<TKeys, " ?", "?">;
  const filterLines = [...keyList]
    .reverse()
    .map((key) => {
      const content = `?${valueMaps[key]?.sourceKey} wdt:${
        valueMaps[key]?.pCode
      } ?${String(key)} ${valueMaps[key]?.joinChar}`;
      return valueMaps[key]?.optional ? `OPTIONAL{${content}}` : content;
    })
    .join("\n") as JoinStringArray<MapArrayOp<TKeys, TValueMaps>, "\n">;
  return `SELECT ?item ${returnKeys}
WHERE {
?item wdt:P31 ${mainValueKey} .
${filterLines}
}` as QueryString<TRefs, TKeys, TValueKey, TValueMaps>;
}
type DBDTTZ<
  TYear extends number = number,
  TMonth extends number = number,
  TDay extends number = number,
  TTZ extends `${number}:${number}:${number}` = `${number}:${number}:${number}`
> = `${TYear}-${TMonth}-${TDay}T${TTZ}Z`;
type AllowedWDTypes = "literal" | "uri";
type WDResponseElement<
  TType extends AllowedWDTypes = AllowedWDTypes,
  TValue = unknown,
  TData extends string | null = null
> = TValue extends null
  ? {
      type: TType;
      value: TValue;
    }
  : {
      type: TType;
      value: TValue;
      datatype: TData;
    };
// type WDCoordResponse={}
type WDDTTZResponseElement = WDResponseElement<
  "literal",
  DBDTTZ,
  "http://www.w3.org/2001/XMLSchema#dateTime"
>;
type WDIdRefResponseElement = WDResponseElement<"uri", CodeURI>;
type LatLonString<
  TLatLon extends { lat: number; lon: number } = { lat: number; lon: number }
> = `Point(${TLatLon["lon"]} ${TLatLon["lat"]})`;
type CoordinateResponseElement = WDResponseElement<
  "literal",
  LatLonString,
  "http://www.opengis.net/ont/geosparql#wktLiteral"
>;
type AvailableResponseElements =
  | WDDTTZResponseElement
  | WDIdRefResponseElement
  | CoordinateResponseElement;
export type RawResponseFromWD<
  TRefs extends DBResults2NF,
  TKeys extends (keyof TRefs)[],
  TStatus extends HttpStatusCode = HttpStatusCode,
  TRawElement extends {
    [key in TKeys[number]]: WDResponseElement;
  } = {
    [key in TKeys[number]]: WDResponseElement;
  }
  // TODO think this unknown is making things funky
> = {
  status: TStatus;
  data: TStatus extends 200 ? { results: { bindings: TRawElement[] } } : object;
};
type Test = RawResponseFromWD<WDPoliticalPartyDBEntry, ["country"]>;

export async function buildQueryStringAndPost<
  TRefs extends DBResults2NF,
  TKeys extends (keyof TRefs)[],
  TValueKey extends `wd:Q${number}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends {
    [key in keyof TRefs]?:
      | QueryValueSpec<
          string,
          `P${number}`,
          `wd:Q${number}` | ReturnValKey<keyof TRefs>,
          boolean,
          "."
        >
      | undefined;
  }
>(
  // TODO
  refList: TRefs,
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: TValueMaps
) {
  const builtStr = buildQueryString(
    refList,
    keyList as readonly string[],
    mainValueKey,
    valueMaps
  );
  const result: RawResponseFromWD<TRefs, TKeys> = await axios.get(url, {
    params: { query: builtStr, format: "json" },
  });
  const resultIsOk = (
    res: RawResponseFromWD<TRefs, TKeys>
  ): res is RawResponseFromWD<TRefs, TKeys, 200> => {
    return res["status"] === 200;
  };
  if (!resultIsOk(result)) {
    return null;
  }
  const validatedData = ValidateDataContents(result);
}
// make sure no formatting has changed since last run, if so complain on compile
//
function ValidateDataContents<
  TRefs extends DBResults2NF,
  TKeys extends (keyof TRefs)[],
  TResponse extends RawResponseFromWD<TRefs, TKeys, 200>,
  TData extends TResponse["data"]["results"]["bindings"] = TResponse["data"]["results"]["bindings"],
  TDatum extends TData[number] = TData[number]
>(results: TResponse) {
  return array(object<Struct<TDatum>>({}));
}

function queryNamesForQCodes(qCodes: QCode<number>[]) {
  return `SELECT DISTINCT ?item ?itemLabel
  WHERE
  {
      VALUES ?item {${qCodes.map((code) => `wd:${code}`).join(" ")}}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } 
  }`;
}
function coallesceItems(originalArray: object[], keysToCoallesce: string[]) {
  originalArray;
}
