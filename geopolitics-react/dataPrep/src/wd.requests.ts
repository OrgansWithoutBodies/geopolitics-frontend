import { PCode, QCode } from "./wd.types";

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
  [
    {
      sourceKey: source,
      prefix: "wdt",

      pCode: COORDINATE_LOCATION,
      valueKey: "coords",
      joinChar: ".",
      optional: false,
    },
  ] as const;
const COUNTRY_BLOCK = ({
  source = "item",
  optional = false,
}: {
  source?: string;
  optional?: boolean;
}) =>
  [
    {
      sourceKey: source,
      prefix: "wdt",
      pCode: "P17",
      valueKey: "country",
      joinChar: ".",
      optional,
    },
  ] as const;
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
  [
    {
      sourceKey: source,
      prefix: "wdt",
      pCode: startType,
      valueKey: "start",
      joinChar: ".",
      optional: startOptional,
    },
    {
      sourceKey: source,
      prefix: "wdt",
      pCode: endType,
      valueKey: "end",
      joinChar: ".",
      optional: endOptional,
    },
  ] as const;

export const parties = {
  mainValue: "wd:Q7278",
  includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({}),
    ...TIME_PERIOD_BLOCK({}),
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P1142",
      valueKey: "ideology",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
export const sovereigns = {
  mainValue: "wd:Q3624078",
  includeSubclasses: true,
  query: [
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P1142",
      valueKey: "ideology",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
// TODO get the 'of'
export const independenceDeclarations = {
  mainValue: "wd:Q1464916",
  // includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({ optional: true }),
    // ...TIME_PERIOD_BLOCK({}),
    // ideology: {
    //   sourceKey: "item",
    // prefix: "wdt",

    //   pCode: "P1142",
    //   valueKey: "ideology",
    //   joinChar: ".",
    //   optional: true,
    // },
  ],
} as const;
export const internationalOrganizations = {
  // mutiny (Q511866)
  // rebellion (Q124734)
  // civil war (Q8465)
  mainValue: "wd:Q484652",
  // includeSubclasses: true,
  query: [
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P527",
      valueKey: "hasParts",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
export const pmcs = {
  // mutiny (Q511866)
  // rebellion (Q124734)
  // civil war (Q8465)
  mainValue: "wd:Q1057214",
  // includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({ optional: true }),

    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P607",
      valueKey: "conflict",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
// abandoned railway (Q357685) in lieu of end date?
export const railways = {
  mainValue: "wd:Q728937",
  includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({ optional: true }),
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P3086",
      valueKey: "speedLimit",
      joinChar: ".",
      optional: true,
    },
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P2789",
      valueKey: "connectsWith",
      joinChar: ".",
      optional: true,
    },
  ],
  // speed limit (P3086)
} as const;

// is this useful?
// @TODO modularize - could be useful for pandemic times
export const hospitals = {
  mainValue: "wd:Q16917",
  includeSubclasses: true,
  query: [...COORD_BLOCK({})],
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
  query: [
    ...COORD_BLOCK({}),
    ...COUNTRY_BLOCK({}),
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P1056",
      valueKey: "produces",
      joinChar: ".",
      optional: false,
    },
  ],
} as const;
// TODO include broader categories, maybe make internet-only/version? Q11032
export const newsAgencies = {
  mainValue: "wd:Q192283",
  includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({}),
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P856",
      valueKey: "website",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
const stateActorObject = (qCode: QCode<number & { __brand: "Country" }>) =>
  ({
    mainValue: `wd:${qCode}`,
    includeSubclasses: true,
    query: [
      {
        sourceKey: "item",
        prefix: "wdt",

        pCode: "P3896",
        valueKey: "shape",
        joinChar: ".",
        optional: false,
      },
      {
        sourceKey: "item",
        prefix: "wdt",

        pCode: "P625",
        valueKey: "center",
        joinChar: ".",
        optional: false,
      },
      {
        sourceKey: "item",
        prefix: "wdt",

        pCode: "P571",
        valueKey: "stateStart",
        joinChar: ".",
        optional: false,
      },
      {
        sourceKey: "item",
        prefix: "wdt",

        pCode: "P571",
        valueKey: "stateEnd",
        joinChar: ".",
        optional: true,
      },
    ],
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
  query: [
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P527",
      valueKey: "memberState",
      joinChar: ".",
      optional: false,
    },
  ],
} as const;
export const geopoliticalGroups = {
  mainValue: "wd:Q52110228",
  includeSubclasses: true,
  query: [
    {
      sourceKey: "item",
      prefix: "p",
      pCode: "P527",
      valueKey: "memberStateStatement",
      joinChar: ".",
      optional: false,
    },
    {
      sourceKey: "memberStateStatement",
      prefix: "ps",
      pCode: "P527",
      valueKey: "memberState",
      joinChar: ".",
      optional: false,
    },
    {
      sourceKey: "memberStateStatement",
      prefix: "pq",
      pCode: "P2868",
      valueKey: "membershipStatus",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
export const intergovernmentalOrganizations = {
  mainValue: "wd:Q245065",
  includeSubclasses: true,
  query: [
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P527",
      valueKey: "memberState",
      joinChar: ".",
      optional: false,
    },
  ],
} as const;
export const wars = {
  mainValue: "wd:Q198",
  includeSubclasses: true,
  query: [
    ...TIME_PERIOD_BLOCK({
      startType: "P580",
      endType: "P582",
      startOptional: true,
      endOptional: true,
    }),
    {
      label: "participant",
      // TODO some way of encoding that this returns a country
      sourceKey: "item",
      prefix: "wdt",

      pCode: "P710",
      valueKey: "participant",
      joinChar: ".",
      optional: false,
    },
  ],
} as const;
// pd
// config for simple 'is instance of X or subcat of x (repeating)
const getAllSubcategoriesOf = (code: QCode<number>) =>
  ({
    mainValue: `wd:${code}`,
    includeSubclasses: true,
    query: [],
  } as const);
const getInstancesOf = (code: QCode<number>) =>
  ({
    mainValue: `wd:${code}`,
    query: [],
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
