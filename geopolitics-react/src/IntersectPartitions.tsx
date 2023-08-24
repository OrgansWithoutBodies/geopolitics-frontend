import { HighlightSpecification } from "react-konva-components/src";
import { interpolateHexStrings } from "./colorTools";
import { countryInfo } from "./countryData";
import { intersectSets, subtractSets } from "./intersectSets";

const allCountryCodes = countryInfo.map((val) => val["alpha-3"]);

export function getIntersectionsBetween<TCountryCode extends string>(
  keyA: keyof typeof partitionA,
  keyB: keyof typeof partitionB,
  partitionA: Record<string, { highlightedCountries: TCountryCode[] }>,
  partitionB: Record<string, { highlightedCountries: TCountryCode[] }>
): TCountryCode[] {
  return [
    ...intersectSets(
      new Set(partitionA[keyA].highlightedCountries),
      new Set(partitionB[keyB].highlightedCountries)
    ),
  ];
}
export function getSubtraction<TCountryCode extends string>(
  aList: TCountryCode[],
  subList: TCountryCode[]
): TCountryCode[] {
  return [
    ...subtractSets(new Set(aList), new Set(subList), new Set(allCountryCodes)),
  ];
}

type HighlightRecord<TKey extends number> = Record<
  TKey,
  HighlightSpecification<TKey>
>;
export function IntersectPartitions<
  TCountryCode extends number,
  TKeyA extends TCountryCode,
  TKeyB extends TCountryCode
>(
  partitionA: HighlightRecord<TKeyA>,
  partitionB: HighlightRecord<TKeyB>,
  nameA: Readonly<number> = 0,
  nameB: Readonly<number> = 1
): HighlightRecord<
  `${TKeyA}-${TKeyB}` | `${typeof nameA}:${TKeyA}` | `${typeof nameB}:${TKeyB}`
> {
  const allPartitionA = Object.values(partitionA)
    .map(
      (val) =>
        (val as HighlightSpecification<TCountryCode>).highlightedCountries
    )
    .flat() as TCountryCode[];
  const allPartitionB = Object.values(partitionB)
    .map(
      (val) =>
        (val as HighlightSpecification<TCountryCode>).highlightedCountries
    )
    .flat() as TCountryCode[];

  const partitionsFromIntersections = Object.keys(partitionA)
    .map((valA) => {
      return Object.keys(partitionB).map((valB) => {
        return [
          `${valA}-${valB}`,
          {
            highlightedCountries: getIntersectionsBetween(
              valA,
              valB,
              partitionA,
              partitionB
            ),
            highlightColor: interpolateHexStrings(
              partitionA[valA].highlightColor,
              partitionB[valB].highlightColor
            ),
          },
        ];
      });
    })
    .flat();

  const entriesInAButNotB = Object.keys(partitionA).map((valA) => [
    `${nameA}:${valA}`,
    {
      highlightedCountries: getSubtraction(
        partitionA[valA].highlightedCountries,
        allPartitionB
      ),
      highlightColor: partitionA[valA].highlightColor,
    },
  ]);
  const entriesInBButNotA = Object.keys(partitionB).map((valB) => [
    `${nameB}:${valB}`,
    {
      highlightedCountries: getSubtraction(
        partitionB[valB].highlightedCountries,
        allPartitionA
      ),
      highlightColor: partitionB[valB].highlightColor,
    },
  ]);

  return Object.fromEntries([
    ...partitionsFromIntersections,
    ...entriesInAButNotB,
    ...entriesInBButNotA,
  ]);
}
