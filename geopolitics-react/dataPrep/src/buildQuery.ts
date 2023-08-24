import axios, { HttpStatusCode } from "axios";
import { INSTANCE_OF, SUBCLASS_OF } from "./wd.requests";
import {
  CodeURI,
  DBResults2NF,
  JoinStringArray,
  MapArrayOp,
  PCode,
  QueryString,
  QueryValueSpec,
  ReturnValKey,
} from "./wd.types";

// TODO map query to result validator
// r = requests.get(url, params = {'format': 'json', 'query': query})
// data = r.json()

export function buildQueryString<
  TRefs extends DBResults2NF,
  TKeys extends readonly string[],
  TValueKey extends `wd:Q${number}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends QueryValueSpec<
    string,
    PCode,
    `wd:Q${number}` | ReturnValKey<keyof TRefs>,
    boolean,
    "."
  >[]
>(
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: Readonly<TValueMaps>,
  includeSubclasses: boolean
): QueryString<TRefs, TKeys, TValueKey, TValueMaps> {
  const filterLines = buildFilterLines<TRefs, TKeys, TValueMaps>(
    keyList,
    valueMaps
  );
  return buildFinalQuery<TRefs, TKeys, TValueKey, TValueMaps>(
    keyList,
    includeSubclasses,
    mainValueKey,
    filterLines
  );
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
type WDURLResponseElement = WDResponseElement<"uri", `https://${string}`>;
type LatLonString<
  TLatLon extends { lat: number; lon: number } = { lat: number; lon: number }
> = `Point(${TLatLon["lon"]} ${TLatLon["lat"]})`;
type CoordinateResponseElement = WDResponseElement<
  "literal",
  LatLonString,
  "http://www.opengis.net/ont/geosparql#wktLiteral"
>;
export type AvailableResponseElements =
  | WDDTTZResponseElement
  | WDIdRefResponseElement
  | WDURLResponseElement
  | CoordinateResponseElement;
export type GenericWDElement<TKeys extends (string | number | symbol)[]> = {
  [key in TKeys[number]]: WDResponseElement;
};

export type RawResponseFromWD<
  TRefs extends DBResults2NF,
  TKeys extends (keyof TRefs)[],
  TStatus extends HttpStatusCode = HttpStatusCode,
  TRawElement extends GenericWDElement<TKeys> = GenericWDElement<TKeys>
  // TODO think this unknown is making things funky
> = {
  status: TStatus;
  data: TStatus extends 200 ? { results: { bindings: TRawElement[] } } : object;
};
export const defaultUrl = "https://query.wikidata.org/sparql?flavor=dump";
function buildFilterLines<
  TRefs extends DBResults2NF,
  TKeys extends readonly string[],
  TValueMaps extends QueryValueSpec<
    string,
    PCode,
    `wd:Q${number}` | ReturnValKey<keyof TRefs>,
    boolean,
    "."
  >[]
>(keyList: TKeys, valueMaps: TValueMaps) {
  return (
    valueMaps
      // .reverse()
      .map((valueMap) => {
        const content = buildFilterLineContent<TRefs, TValueMaps>(valueMap);

        return valueMap.optional ? `OPTIONAL{${content}}` : content;
      })
      .join("\n") as JoinStringArray<MapArrayOp<TKeys, TValueMaps>, "\n">
  );
}
function buildFinalQuery<
  TRefs extends DBResults2NF,
  TKeys extends readonly string[],
  TValueKey extends `wd:Q${number}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends QueryValueSpec<
    string,
    PCode,
    `wd:Q${number}` | ReturnValKey<keyof TRefs>,
    boolean,
    "."
  >[]
>(
  keyList: TKeys,
  includeSubclasses: boolean,
  mainValueKey: TValueKey,
  filterLines: JoinStringArray<MapArrayOp<TKeys, TValueMaps>, "\n">
): QueryString<TRefs, TKeys, TValueKey, TValueMaps> {
  const returnKeys = keyList
    .map((key) => `?${String(key)}`)
    .join(" ") as JoinStringArray<TKeys, " ?", "?">;
  return `SELECT ?item ${returnKeys}
    WHERE {
      ?item wdt:${INSTANCE_OF}${
    includeSubclasses ? `/wdt:${SUBCLASS_OF}*` : ""
  } ${mainValueKey} .
      ${filterLines}
    }` as QueryString<TRefs, TKeys, TValueKey, TValueMaps>;
}
function buildFilterLineContent<
  TRefs extends DBResults2NF,
  TValueMaps extends QueryValueSpec<
    string,
    PCode,
    `wd:Q${number}` | ReturnValKey<keyof TRefs>,
    boolean,
    "."
  >[]
>(valueMap: TValueMaps[number]) {
  return `?${valueMap.sourceKey} ${valueMap.prefix}:${valueMap.pCode} ?${String(
    valueMap.valueKey
  )} ${valueMap.joinChar}`;
}

export async function buildQueryStringAndPost<
  TRefs extends DBResults2NF,
  TKeys extends (keyof TRefs)[],
  TValueKey extends `wd:Q${number}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends QueryValueSpec<
    string,
    `P${number}`,
    `wd:Q${number}` | ReturnValKey<keyof TRefs>,
    boolean,
    "."
  >[]
>(
  // TODO
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: Readonly<TValueMaps>,
  includeSubclasses = false,
  // in case we want to build a sparql db locally, override here
  url = defaultUrl
) {
  const builtStr = buildQueryString(
    keyList as readonly string[],
    mainValueKey,
    valueMaps,
    includeSubclasses
  );

  console.log("TEST123", builtStr);
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
  return { validatedData, result };
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
  return results.data.results.bindings.map((val) =>
    Object.fromEntries(
      Object.entries(val).map(([kk, vv]) => {
        const [k, v] = [kk, vv] as [string, WDResponseElement];
        if (vIsQCode(v)) {
          const splitVal = (v["value"] as string).split("/");
          return [k, { ...v, value: splitVal[splitVal.length - 1] }];
        }
        return [k, v];
      })
    )
  );

  // return array(object<Struct<TDatum>>({}));
}
export function vIsQCode(v: {
  type: AllowedWDTypes;
  value: unknown;
  datatype: null;
}) {
  return (
    v["type"] === "uri" &&
    (v["value"] as string).startsWith("http://www.wikidata.org/entity/Q")
  );
}
// type Test = JoinStringArray<
//   MapArrayOp<
//     ["test", "test2"],
//     [
//       {
//         sourceKey: "test";
//         prefix: "wdt";
//         pCode: "P123";
//         valueKey: "testval";
//         optional: false;
//         joinChar: ".";
//       }
//     ]
//   >,
//   "\n"
// >;