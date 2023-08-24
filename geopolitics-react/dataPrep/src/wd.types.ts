// TODO overwrite array join/reverse prototypes to have rich typing
import type { BrandedNumber } from "type-library/src";
export type WDId<TCategory extends string> = string & {
  __brand: "WDId";
  __category: TCategory;
};
type Allowed2NFReturnValues = Readonly<
  string | WDId<string> | number | BrandedNumber<string>
>;
// type Url = string;
// type DateTimeTZString = string;
// type ParsedWDReturnTypes = string | URL | DateTimeTZString;
// TODO specify the expected return type per-element?
export type DBResults2NF = Record<Readonly<string>, Allowed2NFReturnValues>;
export type WDPoliticalPartyDBEntry<
  // effectively forces extends to be true
  T = {
    id: WDId<"Political Party">;
    country: WDId<"Country">;
    ideology: WDId<"Political Ideology">;
    start: string;
    end: string;
  }
> = T extends DBResults2NF ? T : never;

export type Identity<T> = {
  [P in keyof T]: T[P];
};
export type Replace<
  T extends Record<Readonly<string>, unknown>,
  K extends keyof T,
  TReplace
> = Identity<Omit<T, K> & Record<K, TReplace>>;
export type ConcatStringArray<
  Strings extends readonly string[],
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Head extends string
    ? Rest extends readonly string[]
      ? ConcatStringArray<Rest, `${Acc}${Head}`>
      : Acc
    : Acc
  : Acc;

export type JoinStringArray<
  Strings extends readonly string[],
  Joiner extends string = ",",
  FirstJoin extends string = "",
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Rest extends readonly string[]
    ? JoinStringArray<
        Rest,
        Joiner,
        FirstJoin,
        Head extends string
          ? Rest extends string
            ? // first line special case
              Acc extends ""
              ? `${FirstJoin}${Head}${Rest}`
              : ConcatStringArray<readonly [Acc, Joiner, Head]>
            : // TODO this is the never error - head not string
              never
          : never
      >
    : never
  : Acc;
export type ReturnValKey<TCode extends string | number | symbol> =
  TCode extends string ? `${TCode}` : never;
export type PCode<TCode extends number = number> = `P${TCode}`;
export type QCode<TCode extends number = number> = `Q${TCode}`;
// TODO probably can format request to avoid these, not sure how. 'Flavor'?
export type CodeURI<
  TCode extends PCode<number> | QCode<number> = PCode<number> | QCode<number>
> = `https://www.wikidata.org/wiki/${TCode}`;
export type SurroundString<
  TBegin extends string,
  TString extends string,
  TEnd extends string
> = `${TBegin}${TString}${TEnd}`;
export type SurroundStringWithCurlies<TString extends string> = SurroundString<
  "{",
  TString,
  "}"
>;
export type QueryValueSpec<
  TSourceKey extends string = string,
  TPCode extends PCode<number> = PCode<number>,
  TValueKey extends `wd:${QCode<number>}` | ReturnValKey<string> =
    | `wd:${QCode<number>}`
    | ReturnValKey<string>,
  // TODO if this value is optional then the returned value is possibly null
  TOptional extends boolean = boolean,
  // https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial#SPARQL_basics
  // if you end a triple with a semicolon (;) instead of a period, you can add another predicate-object pair. This allows us to abbreviate a query
  // You can use a pair of brackets ([]) in place of a variable, which acts as an anonymous variable. Inside the brackets, you can specify predicate-object pairs, just like after a ;
  // multiple objects for the same subject and predicate can be listed separated by commas.
  // You can add path elements with a forward slash (/).

  // ?item wdt:P31/wdt:P279/wdt:P279 ?class.
  // This is equivalent to either of the following:
  // ?item wdt:P31 ?temp1.
  // ?temp1 wdt:P279 ?temp2.
  // ?temp2 wdt:P279 ?class.
  // OR
  // ?item wdt:P31 [ wdt:P279 [ wdt:P279 ?class ] ].

  // prefix: p:, [...] points not to the object, but to a statement node.  This node then is the subject of other triples
  // ORDER/LIMIT
  // FILTER
  // SERVICE
  TJoinChar extends "." | ";" = ".",
  TPrefix extends "wdt" | "pq" | "p" | "ps" = "wdt" | "pq" | "p" | "ps"
> = {
  sourceKey: TSourceKey;
  prefix: TPrefix;
  pCode: TPCode;
  valueKey: TValueKey;
  optional: TOptional;
  joinChar: TJoinChar;
};
export type QueryStringLiteralSpecLine<
  TSpec extends QueryValueSpec,
  TContents extends string = `?${TSpec["sourceKey"]} ${TSpec["prefix"]}:${TSpec["pCode"]}${
    // TODO add / & *
    ""
  } ${TSpec["valueKey"]} ${TSpec["joinChar"]}`
> = TSpec["optional"] extends true
  ? `OPTIONAL${SurroundStringWithCurlies<TContents>}`
  : TContents;
// type MapValue<>=QueryStringLiteralSpecLine
export type MapArrayOp<
  Keys extends readonly string[],
  TMap extends QueryValueSpec[],
  Acc extends readonly string[] = []
> = Keys extends readonly [infer Head, ...infer Rest]
  ? Head extends keyof TMap
    ? TMap[Head] extends QueryValueSpec
      ? Rest extends []
        ? // TODO this orientation reverses this list - maybe re-reverse it if not too complex typewise?
          [QueryStringLiteralSpecLine<TMap[Head]>, ...Acc]
        : Rest extends readonly string[]
        ? MapArrayOp<
            Rest,
            TMap,
            [QueryStringLiteralSpecLine<TMap[Head]>, ...Acc]
          >
        : never
      : Acc
    : Acc
  : ["UHOH1"];

export type QueryStringLiteralInstanceOf<
  TRefs extends Readonly<DBResults2NF>,
  TKeys extends Readonly<Partial<keyof TRefs>[]>,
  TValueKey extends `wd:${QCode<number>}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends QueryValueSpec<
    string,
    PCode<number>,
    `wd:${QCode<number>}` | ReturnValKey<keyof TRefs>
  >[],
  TMappedArray extends string[] = TKeys extends string[]
    ? MapArrayOp<TKeys, TValueMaps>
    : never,
  TDistinct extends "DISTINCT " | "" = ""
> = TKeys extends Readonly<string>[]
  ? `SELECT ?item ${TDistinct}${JoinStringArray<
      TKeys,
      " ?",
      "?"
    >}\nWHERE {\n${QueryStringLiteralSpecLine<
      QueryValueSpec<"item", "P31", TValueKey, false, ".">
    >}\n${JoinStringArray<TMappedArray, "\n">}
}`
  : never;

export type QueryString<
  TRefs extends Readonly<DBResults2NF>,
  TKeys extends Readonly<Partial<keyof TRefs>[]>,
  TValueKey extends `wd:${QCode<number>}` | ReturnValKey<TKeys[number]>,
  TValueMaps extends QueryValueSpec<
    string,
    PCode<number>,
    `wd:${QCode<number>}` | ReturnValKey<keyof TRefs>
  >[]
> = QueryStringLiteralInstanceOf<TRefs, TKeys, TValueKey, TValueMaps> & {
  __expectedResults: TRefs;
};
// function buildQueryFilterLine<>() {}
export type FoldDBResults<
  T extends DBResults2NF,
  TArrayTypes extends Array<keyof T>
> = {
  [key in keyof T]: key extends TArrayTypes[number] ? T[key][] : T[key];
};

// take from 2NF to nested objs
export type WDPoliticalParty = FoldDBResults<
  WDPoliticalPartyDBEntry,
  ["ideology"]
>;
// declare global {
//   interface Array<T> {
//     join<TSeparator = Readonly<string> | undefined>(
//       separator?: TSeparator
//     ): T extends Readonly<string>
//       ? TSeparator extends string
//         ? JoinStringArray<T[], TSeparator, ",", "test">
//         : string
//       : string;
//   }
// }
// type Test = JoinStringArray<["a", "b", "c"], " . ">;
// const test = ["a", "b", "c"].join(" . ");
