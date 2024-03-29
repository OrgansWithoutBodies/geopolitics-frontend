import axios, { HttpStatusCode } from "axios";
import {
  CodeURI,
  DBResults2NF,
  JoinStringArray,
  MapArrayOp,
  PCode,
  QCode,
  QueryString,
  QueryValueSpec,
  ReturnValKey,
  WDPoliticalPartyDBEntry,
} from "./wd.types";

const url = "https://query.wikidata.org/sparql?flavor=dump";
const INSTANCE_OF = "P31" as const;
const SUBCLASS_OF = "P279" as const;
const COORDINATE_LOCATION = "P625" as const;
const MEMBER_OF = "P463" as const;
const UN = "Q1065" as const;

// Q55978503
// Q22997934
const elections = `
SELECT DISTINCT ?item ?title ?seats ?jurisdiction (YEAR(?inception) AS ?start) (YEAR(?dissolution) AS ?end)
WHERE
{
  ?item wdt:${INSTANCE_OF}/wdt:P279* wd:Q1752346 .
  OPTIONAL { ?item wdt:P1342 ?seats . }
  OPTIONAL {
    ?item wdt:P1001 ?j .
    ?j rdfs:label ?jurisdiction .
  }
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P576 ?dissolution . }
  OPTIONAL { ?item rdfs:label ?title . }
}
` as const;

export const unMemberStates = `
#UN member states
SELECT DISTINCT ?state  WHERE {
  ?state wdt:${INSTANCE_OF}/wdt:${SUBCLASS_OF}* wd:Q3624078;
         p:P463 ?memberOfStatement.
  ?memberOfStatement a wikibase:BestRank;
                     ps:P463 wd:Q1065.
  MINUS { ?memberOfStatement pq:P582 ?endTime. }
  MINUS { ?state wdt:P576|wdt:P582 ?end. }
}` as const;

const COORD_BLOCK = ({ source = "item" }: { source?: string }) =>
  ({
    coords: {
      sourceKey: source,
      pCode: COORDINATE_LOCATION,
      valueKey: "?coords",
      joinChar: ".",
      optional: false,
    },
  } as const);
const COUNTRY_BLOCK = ({
  source = "item",
  optional = false,
}: {
  source?: string;
  optional?: boolean;
}) =>
  ({
    country: {
      sourceKey: source,
      pCode: "P17",
      valueKey: "?country",
      joinChar: ".",
      optional,
    },
  } as const);
const TIME_PERIOD_BLOCK = ({
  source = "item",
  startOptional = true,
  endOptional = true,
  startType = "P571",
  endType = "P576",
}: {
  source?: string;
  startOptional?: boolean;
  endOptional?: boolean;
  startType?: PCode<571 | 580>;
  endType?: PCode<576 | 582>;
}) =>
  ({
    start: {
      sourceKey: source,
      pCode: startType,
      valueKey: "?start",
      joinChar: ".",
      optional: startOptional,
    },
    end: {
      sourceKey: source,
      pCode: endType,
      valueKey: "?end",
      joinChar: ".",
      optional: endOptional,
    },
  } as const);

export const parties = {
  mainValue: "wd:Q7278",
  includeSubclasses: true,
  query: {
    ...COUNTRY_BLOCK({}),
    ...TIME_PERIOD_BLOCK({}),
    ideology: {
      sourceKey: "item",
      pCode: "P1142",
      valueKey: "?ideology",
      joinChar: ".",
      optional: true,
    },
  },
} as const;
export const sovereigns = {
  mainValue: "wd:Q3624078",
  includeSubclasses: true,
  query: {
    ideology: {
      sourceKey: "item",
      pCode: "P1142",
      valueKey: "?ideology",
      joinChar: ".",
      optional: true,
    },
  },
} as const;
// TODO get the 'of'
export const independenceDeclarations = {
  mainValue: "wd:Q1464916",
  // includeSubclasses: true,
  query: {
    ...COUNTRY_BLOCK({ optional: true }),
    // ...TIME_PERIOD_BLOCK({}),
    // ideology: {
    //   sourceKey: "item",
    //   pCode: "P1142",
    //   valueKey: "?ideology",
    //   joinChar: ".",
    //   optional: true,
    // },
  },
} as const;
export const pmcs = {
  // mutiny (Q511866)
  // rebellion (Q124734)
  // civil war (Q8465)
  mainValue: "wd:Q1057214",
  // includeSubclasses: true,
  query: {
    ...COUNTRY_BLOCK({ optional: true }),

    conflict: {
      sourceKey: "item",
      pCode: "P607",
      valueKey: "?conflict",
      joinChar: ".",
      optional: true,
    },
  },
} as const;
// abandoned railway (Q357685) in lieu of end date?
export const railways = {
  mainValue: "wd:Q728937",
  includeSubclasses: true,
  query: {
    ...COUNTRY_BLOCK({ optional: true }),
    speedLimit: {
      sourceKey: "item",
      pCode: "P3086",
      valueKey: "?speedLimit",
      joinChar: ".",
      optional: true,
    },
    connectsWith: {
      sourceKey: "item",
      pCode: "P2789",
      valueKey: "?connectsWith",
      joinChar: ".",
      optional: true,
    },
  },
  // speed limit (P3086)
} as const;

// is this useful?
// @TODO modularize - could be useful for pandemic times
export const hospitals = {
  mainValue: "wd:Q16917",
  includeSubclasses: true,
  query: {
    ...COORD_BLOCK({}),
  },
} as const;
export const mines = {
  mainValue: "wd:Q820477",
  includeSubclasses: true,
  query: {
    ...COORD_BLOCK({}),
    ...COUNTRY_BLOCK({}),
    produces: {
      sourceKey: "item",
      pCode: "P1056",
      valueKey: "?produces",
      joinChar: ".",
      optional: false,
    },
  },
} as const;
export const newsAgencies = {
  mainValue: "wd:Q192283",
  includeSubclasses: true,
  query: {
    ...COUNTRY_BLOCK({}),
    website: {
      sourceKey: "item",
      pCode: "P856",
      valueKey: "?website",
      joinChar: ".",
      optional: true,
    },
  },
} as const;
export const wars = {
  mainValue: "wd:Q198",
  includeSubclasses: true,
  query: {
    ...TIME_PERIOD_BLOCK({
      startType: "P580",
      endType: "P582",
      startOptional: true,
      endOptional: true,
    }),
    participant: {
      // TODO some way of encoding that this returns a country
      sourceKey: "item",
      pCode: "P710",
      valueKey: "?participant",
      joinChar: ".",
      optional: false,
    },
  },
} as const;
// pd
// config for simple 'is instance of X or subcat of x (repeating)
const getAllSubcategoriesOf = (code: QCode<number>) =>
  ({
    mainValue: `wd:${code}`,
    includeSubclasses: true,
    query: {},
  } as const);
const getInstancesOf = (code: QCode<number>) =>
  ({
    mainValue: `wd:${code}`,
    query: {},
  } as const);
export const minerals = getAllSubcategoriesOf("Q889659");
export const metals = getAllSubcategoriesOf("Q11426");
export const rocks = getAllSubcategoriesOf("Q8063");
export const colonies = getAllSubcategoriesOf("Q133156");
export const revolutions = getAllSubcategoriesOf("Q10931");
export const militaryAlliances = getAllSubcategoriesOf("Q1127126");
// this ones huge, pretty small in terms of usefulness
// export const roads = getAllSubcategoriesOf("Q34442");
export const regimeChanges = getInstancesOf("Q1673271");

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
  // refList: TRefs,
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: TValueMaps,
  includeSubclasses: boolean
): QueryString<TRefs, TKeys, TValueKey, TValueMaps> {
  console.log("test123", keyList);

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
      ?item wdt:${INSTANCE_OF}${
    includeSubclasses ? `/wdt:${SUBCLASS_OF}*` : ""
  } ${mainValueKey} .
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
type WDURLResponseElement = WDResponseElement<"uri", `https://${string}`>;
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
  keyList: TKeys,
  mainValueKey: TValueKey,
  valueMaps: TValueMaps,
  includeSubclasses = false
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
function ValidateQCodes(
  results: {
    item: {
      type: "uri";
      value: `http://www.wikidata.org/entity/${QCode<number>}`;
    };
    itemLabel: { "xml:lang": "en"; type: "literal"; value: string };
  }[]
) {
  return Object.fromEntries(
    results.map((val) => {
      const splitVal = val["item"]["value"].split("/");
      return [splitVal[splitVal.length - 1], val["itemLabel"]["value"]];
    })
  );
  // return array(object<Struct<TDatum>>({}));
}

export function buildQueryForQCodeNames(qCodes: QCode<number>[]) {
  const test = qCodes.join(" ");
  const val = `SELECT DISTINCT ?item ?itemLabel
      WHERE
      {
        VALUES ?item {${qCodes.map((code) => `wd:${code}`).join(" ")}}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } 
      }`;

  return val;
}
export async function getQCodeNames(qCodes: QCode<number>[]) {
  const chunkSize = 500;
  const numChunks = Math.ceil(qCodes.length / chunkSize);
  let currentResults: any[] = [];
  let currentChunk = 0;
  // console.log(result.data);
  const resultIsOk = (res: any) => {
    return res["status"] === 200;
  };
  // TODO im sure theres a better way to lookup that wouldnt need to be batched. I dont know it
  while (currentChunk < numChunks) {
    const query = buildQueryForQCodeNames(
      qCodes.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize)
    );

    const result = await axios.get(url, {
      params: { query, format: "json" },
    });
    if (!resultIsOk(result)) {
      return null;
    }
    currentResults = [...currentResults, ...result.data["results"]["bindings"]];
    currentChunk += 1;
    console.log(`Got chunk ${currentChunk} of ${numChunks}`);
    // add a wait to prevent angering the wikidata gods
    await new Promise((r) => setTimeout(r, 1000));
  }
  return ValidateQCodes(currentResults);
}
function coallesceItems(originalArray: object[], keysToCoallesce: string[]) {
  originalArray;
}
// TODO
// https://www.crisisgroup.org/crisiswatch/database
// https://en.wikinews.org/wiki/Category:Category
// maybe do something with the linked names in a given wikinews article?
