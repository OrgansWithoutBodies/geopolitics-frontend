import axios, { AxiosResponse, HttpStatusCode } from "axios";
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
} from "./wd.types";

export const INSTANCE_OF = "P31" as const;
export const SUBCLASS_OF = "P279" as const;
export const COORDINATE_LOCATION = "P625" as const;
export const MEMBER_OF = "P463" as const;
export const UN = "Q1065" as const;

// Q55978503
// Q22997934
export const elections = `
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
export const internationalOrganizations = {
  // mutiny (Q511866)
  // rebellion (Q124734)
  // civil war (Q8465)
  mainValue: "wd:Q484652",
  // includeSubclasses: true,
  query: {
    hasParts: {
      sourceKey: "item",
      pCode: "P527",
      valueKey: "?hasParts",
      joinChar: ".",
      optional: true,
    },
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

// military action (Q15835236)
// drone attack (Q30588142)
// airstrike (Q2380335)
// military strike (Q6857862)
// participant (P710)
// object has role (P3831)
// perpetrator (Q18028810)
// sourcing circumstances (P1480)
// military operation plan (Q149377)
// state (former or current) (Q96196009)
// facet of (P1269)
// republic (Q7270)
// contains the administrative territorial entity (P150)
// history of Lithuania (Q215063)
// target (P533)
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
// TODO include broader categories, maybe make internet-only/version? Q11032
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
const stateActorObject = (qCode: QCode<number & { __brand: "Country" }>) =>
  ({
    mainValue: `wd:${qCode}`,
    includeSubclasses: true,
    query: {
      shape: {
        sourceKey: "item",
        pCode: "P3896",
        valueKey: "?shape",
        joinChar: ".",
        optional: false,
      },
      center: {
        sourceKey: "item",
        pCode: "P625",
        valueKey: "?center",
        joinChar: ".",
        optional: false,
      },
      stateStart: {
        sourceKey: "item",
        pCode: "P571",
        valueKey: "?stateStart",
        joinChar: ".",
        optional: false,
      },
      stateEnd: {
        sourceKey: "item",
        pCode: "P571",
        valueKey: "?stateEnd",
        joinChar: ".",
        optional: true,
      },
    },
  } as const);

// inception (P571)
// dissolved, abolished or demolished date (P576)
export const countries = stateActorObject("Q6256" as any);
// state - for some reason canadian provinces are considered states
// territory (Q4835091)
// mainValue: "wd:Q7275",
// country
export const dependentTerritories = stateActorObject("Q161243" as any);
export const disputedTerritories = stateActorObject("Q15239622" as any);
// state with limited recognition (Q15634554)
export const limitedRecognitionStates = stateActorObject("Q15634554" as any);
export const tradeBlocs = {
  mainValue: "wd:Q1129645",
  includeSubclasses: true,
  query: {
    memberState: {
      sourceKey: "item",
      pCode: "P527",
      valueKey: "?memberState",
      joinChar: ".",
      optional: false,
    },
  },
} as const;
export const geopoliticalGroups = {
  mainValue: "wd:Q52110228",
  includeSubclasses: true,
  query: {
    memberState: {
      sourceKey: "item",
      pCode: "P527",
      valueKey: "?memberState",
      joinChar: ".",
      optional: false,
    },
  },
} as const;
export const intergovernmentalOrganizations = {
  mainValue: "wd:Q245065",
  includeSubclasses: true,
  query: {
    memberState: {
      sourceKey: "item",
      pCode: "P527",
      valueKey: "?memberState",
      joinChar: ".",
      optional: false,
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
// export const countries = getInstancesOf("Q6256");
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

const defaultUrl = "https://query.wikidata.org/sparql?flavor=dump";
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
interface QCodeResult {
  item: {
    type: "uri";
    value: `http://www.wikidata.org/entity/${QCode<number>}`;
  };
  itemLabel: {
    "xml:lang": "en";
    type: "literal";
    value: string;
  };
}

function ValidateQCodes(results: QCodeResult[]) {
  return Object.fromEntries(
    results.map((val) => {
      const splitVal = val["item"]["value"].split("/");
      return [splitVal[splitVal.length - 1], val["itemLabel"]["value"]];
    })
  );
  // return array(object<Struct<TDatum>>({}));
}

export function buildQueryForQCodeNames(qCodes: QCode<number>[]) {
  const val = `SELECT DISTINCT ?item ?itemLabel
      WHERE
      {
        VALUES ?item {${qCodes.map((code) => `wd:${code}`).join(" ")}}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } 
      }`;

  return val;
}
export async function getQCodeNames(qCodes: QCode<number>[], url = defaultUrl) {
  const chunkSize = 500;
  const numChunks = Math.ceil(qCodes.length / chunkSize);
  let currentResults: QCodeResult[] = [];
  let currentChunk = 0;
  // console.log(result.data);
  const resultIsOk = (
    res: AxiosResponse<{
      results: {
        bindings: QCodeResult[];
      };
    }>
  ) => {
    return res["status"] === 200;
  };
  // TODO im sure theres a better way to lookup that wouldnt need to be batched. I dont know it
  while (currentChunk < numChunks) {
    const query = buildQueryForQCodeNames(
      qCodes.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize)
    );

    const result = await axios.get<{ results: { bindings: QCodeResult[] } }>(
      url,
      {
        params: { query, format: "json" },
      }
    );
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
// function coallesceItems(originalArray: object[], keysToCoallesce: string[]) {
//   originalArray;
// }
// TODO
// https://www.crisisgroup.org/crisiswatch/database
// https://en.wikinews.org/wiki/Category:Category
// maybe do something with the linked names in a given wikinews article?
