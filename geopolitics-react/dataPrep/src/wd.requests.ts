import { WDPCode } from "./PCodes";
import { WDQCode } from "./QCodes";
import { AvailableQuery, PCode, QCode } from "./wd.types";

// TODO if we force keys to be mapped to specific values, then we can get rid of 'type' key altogether

export const UN = "Q1065" as const;

export const elections = `
SELECT DISTINCT ?item ?title ?seats ?jurisdiction (YEAR(?inception) AS ?start) (YEAR(?dissolution) AS ?end)
WHERE
{
  ?item wdt:${WDPCode.INSTANCE_OF}/wdt:P279* wd:Q1752346 .
  OPTIONAL { ?item wdt:P1342 ?seats . }
  OPTIONAL {
    ?item wdt:P1001 ?j .
    ?j rdfs:label ?jurisdiction .
  }
  OPTIONAL { ?item wdt:${WDPCode.INCEPTION} ?inception . }
  OPTIONAL { ?item wdt:P576 ?dissolution . }
  OPTIONAL { ?item rdfs:label ?title . }
}
` as const;

export const unMemberStates = `
#UN member states
SELECT DISTINCT ?state  WHERE {
  ?state wdt:${WDPCode.INSTANCE_OF}/wdt:${WDPCode.SUBCLASS_OF}* wd:Q3624078;
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

      pCode: WDPCode.COORDINATE_LOCATION,
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
  startType = WDPCode.INCEPTION,
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
// TODO what did I mean here
export const independenceDeclarations = {
  mainValue: "wd:Q1464916",
  query: [...COUNTRY_BLOCK({ optional: true })],
} as const;
export const pmcs = {
  mainValue: "wd:Q1057214",
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
      pCode: WDPCode.OFFICIAL_WEBSITE,
      valueKey: "website",
      joinChar: ".",
      optional: true,
    },
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: WDPCode.WEB_FEED_URL,
      valueKey: "rssFeed",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
export const newspaper = {
  mainValue: "wd:Q11032",
  includeSubclasses: true,
  query: [
    ...COUNTRY_BLOCK({}),
    // TODO only filter to english
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: WDPCode.OFFICIAL_WEBSITE,
      valueKey: "website",
      joinChar: ".",
      optional: true,
    },
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: WDPCode.WEB_FEED_URL,
      valueKey: "rssFeed",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
const STATE_ACTOR_BLOCK = () =>
  [
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

      pCode: WDPCode.INCEPTION,
      valueKey: "stateStart",
      joinChar: ".",
      optional: false,
    },
    {
      sourceKey: "item",
      prefix: "wdt",

      pCode: WDPCode.INCEPTION,
      valueKey: "stateEnd",
      joinChar: ".",
      optional: true,
    },
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: WDPCode.CONTINENT,
      // WDPCode.APPLIES_TO_PART
      valueKey: "continent",
      joinChar: ".",
      optional: true,
    },
  ] as const;
const stateActorObject = (qCode: QCode<number>) =>
  ({
    mainValue: `wd:${qCode}`,
    includeSubclasses: true,
    query: STATE_ACTOR_BLOCK(),
  } as const);

// dissolved, abolished or demolished date (P576)
// territory (Q4835091)
// state - for some reason canadian provinces are considered states
// mainValue: "wd:Q7275",
// country
export const limitedRecognitionStates = stateActorObject("Q15634554");
export const dependentTerritories = stateActorObject("Q161243");
export const disputedTerritories = {
  mainValue: `wd:${"Q15239622"}`,
  includeSubclasses: true,
  query: [
    ...STATE_ACTOR_BLOCK(),
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: WDPCode.TERRITORY_CLAIMED_BY,
      valueKey: "territoryClaimedBy",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;
export const countries = {
  mainValue: `wd:${"Q6256"}`,
  includeSubclasses: true,
  query: [
    ...STATE_ACTOR_BLOCK(),
    // {
    //   sourceKey: "item",
    //   prefix: "p",
    //   pCode: WDPCode.LIFE_EXPECTANCY,
    //   valueKey: "lifeExpectancyStatement",
    //   joinChar: ".",
    //   optional: true,
    //   intermediate: true,
    // },
    // {
    //   sourceKey: "lifeExpectancyStatement",
    //   prefix: "ps",
    //   pCode: WDPCode.LIFE_EXPECTANCY,
    //   valueKey: "lifeExpectancy",
    //   joinChar: ".",
    //   optional: true,
    // },
    // {
    //   sourceKey: "lifeExpectancyStatement",
    //   prefix: "pq",
    //   pCode: WDPCode.POINT_IN_TIME,
    //   valueKey: "lifeExpectancyTime",
    //   joinChar: ".",
    //   optional: true,
    // },
  ],
} as const;
export const lifeExpectanciesForCountries = {
  mainValue: `wd:${"Q6256"}`,
  includeSubclasses: true,
  query: [
    // ...STATE_ACTOR_BLOCK(),
    {
      sourceKey: "item",
      prefix: "p",
      pCode: WDPCode.LIFE_EXPECTANCY,
      valueKey: "lifeExpectancyStatement",
      joinChar: ".",
      optional: true,
      intermediate: true,
    },
    {
      sourceKey: "lifeExpectancyStatement",
      prefix: "ps",
      pCode: WDPCode.LIFE_EXPECTANCY,
      valueKey: "lifeExpectancy",
      joinChar: ".",
      optional: true,
    },
    {
      sourceKey: "lifeExpectancyStatement",
      prefix: "pq",
      pCode: WDPCode.POINT_IN_TIME,
      valueKey: "lifeExpectancyTime",
      joinChar: ".",
      optional: true,
    },
  ],
} as const;

export const multilateralOrganizationObject = (
  code: QCode,
  includeSubclasses?: boolean
): AvailableQuery => ({
  mainValue: `wd:${code}`,
  includeSubclasses: includeSubclasses === undefined ? true : includeSubclasses,
  query: [
    {
      sourceKey: "item",
      prefix: "p",
      pCode: WDPCode.HAS_PARTS,
      valueKey: "memberStateStatement",
      joinChar: ".",
      optional: false,
      intermediate: true,
    },
    {
      sourceKey: "memberStateStatement",
      prefix: "ps",
      pCode: WDPCode.HAS_PARTS,
      valueKey: "memberState",
      joinChar: ".",
      optional: false,
    },
    {
      sourceKey: "memberStateStatement",
      prefix: "pq",
      // TODO sometimes this is OBJECT_HAS_ROLE?
      pCode: WDPCode.SUBJECT_HAS_ROLE,
      valueKey: "membershipStatus",
      joinChar: ".",
      optional: true,
    },
    {
      // sometimes people put old members using this
      sourceKey: "memberStateStatement",
      prefix: "pq",
      pCode: WDPCode.END_TIME,
      valueKey: "membershipEndTime",
      joinChar: ".",
      optional: true,
    },
    // TODO endtime qualifier
  ],
});
export const tradeBlocs = multilateralOrganizationObject(WDQCode.TRADE_BLOCS);
export const geopoliticalGroups = multilateralOrganizationObject(
  WDQCode.GEOPOLITICAL_GROUPS
);
export const intergovernmentalOrganizations = multilateralOrganizationObject(
  WDQCode.INTERGOVERNMENTAL_ORGANIZATIONS
);
export const internationalOrganizations = multilateralOrganizationObject(
  WDQCode.INTERNATIONAL_ORGANIZATIONS,
  false
);

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
export const metals = getAllSubcategoriesOf("Q11426");
export const rocks = getAllSubcategoriesOf("Q8063");
export const colonies = getAllSubcategoriesOf("Q133156");
export const revolutions = getAllSubcategoriesOf("Q10931");
export const militaryAlliances = getAllSubcategoriesOf("Q1127126");

// this ones huge, pretty small in terms of usefulness
// export const roads = getAllSubcategoriesOf("Q34442");
export const regimeChanges = getInstancesOf("Q1673271");
