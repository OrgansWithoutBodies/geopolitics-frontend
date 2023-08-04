import { ImperativePanelHandle } from "react-resizable-panels";

import { useEffect, useRef, useState } from "react";
import { WorldMap } from "react-konva-components/src";
import { Timeline } from "./Timeline";
import { countryInfo } from "./countryData";
import { dataService } from "./data/data.service";
import { CountryID } from "./data/data.store";
import { useData } from "./useAkita";
type CountryCode = (typeof countryInfo)[number]["alpha-3"];
const allCountryCodes = countryInfo.map((val) => val["alpha-3"]);

const intersectSets = (a: Set<any>, b: Set<any>) =>
  new Set([...a].filter((i) => b.has(i)));
const notSet = (a: Set<any>, U: Set<any>) =>
  new Set([...U].filter((i) => !a.has(i)));
// subtract a - b
const subtractSets = (a: Set<any>, b: Set<any>, U: Set<any>) =>
  intersectSets(a, notSet(b, U));
``;

// type HighlightRecord<TKey extends number> = Record<
//   TKey,
//   HighlightSpecification<TKey>
// >;

// export function IntersectPartitions<
//   TCountryCode extends number,
//   TKeyA extends TCountryCode,
//   TKeyB extends TCountryCode
// >(
//   partitionA: HighlightRecord<TKeyA>,
//   partitionB: HighlightRecord<TKeyB>,
//   nameA: Readonly<number> = 0,
//   nameB: Readonly<number> = 1
// ): HighlightRecord<
//   `${TKeyA}-${TKeyB}` | `${typeof nameA}:${TKeyA}` | `${typeof nameB}:${TKeyB}`
// > {
//   const allPartitionA = Object.values(partitionA)
//     .map(
//       (val) =>
//         (val as HighlightSpecification<TCountryCode>).highlightedCountries
//     )
//     .flat() as TCountryCode[];
//   const allPartitionB = Object.values(partitionB)
//     .map(
//       (val) =>
//         (val as HighlightSpecification<TCountryCode>).highlightedCountries
//     )
//     .flat() as TCountryCode[];

//   const partitionsFromIntersections = Object.keys(partitionA)
//     .map((valA) => {
//       return Object.keys(partitionB).map((valB) => {
//         return [
//           `${valA}-${valB}`,
//           {
//             highlightedCountries: getIntersectionsBetween(
//               valA,
//               valB,
//               partitionA,
//               partitionB
//             ),
//             highlightColor: interpolateHexStrings(
//               partitionA[valA as TKeyA].highlightColor,
//               partitionB[valB as TKeyB].highlightColor
//             ),
//           },
//         ];
//       });
//     })
//     .flat();

//   const entriesInAButNotB = Object.keys(partitionA).map((valA) => [
//     `${nameA}:${valA}`,
//     {
//       highlightedCountries: getSubtraction(
//         partitionA[valA as TKeyA].highlightedCountries as TKeyA[],
//         allPartitionB
//       ),
//       highlightColor: partitionA[valA as TKeyA].highlightColor,
//     },
//   ]);
//   const entriesInBButNotA = Object.keys(partitionB).map((valB) => [
//     `${nameB}:${valB}`,
//     {
//       highlightedCountries: getSubtraction(
//         partitionB[valB as TKeyB].highlightedCountries as TKeyB[],
//         allPartitionA
//       ),
//       highlightColor: partitionB[valB as TKeyB].highlightColor,
//     },
//   ]);

//   return Object.fromEntries([
//     ...partitionsFromIntersections,
//     ...entriesInAButNotB,
//     ...entriesInBButNotA,
//   ]);
// }
function App() {
  const timelinePanelRef = useRef<ImperativePanelHandle>(null);
  useEffect(() => {
    if (timelinePanelRef.current) {
      // setPaneSize(timelinePanelRef.current.getSize());
    }
  }, [timelinePanelRef.current?.getSize]);
  // const regionColorMap: RegionColorMap = {
  //   Africa: "green",
  //   Americas: "yellow",
  //   Antarctica: "white",
  //   Asia: "blue",
  //   Europe: "cyan",
  //   Oceania: "red",
  // };
  const [{ countryStarts, countries, countryToName, selectedCountry }] =
    useData(["countryToName", "countryStarts", "countries", "selectedCountry"]);
  const [year, setYear] = useState(2000);
  const MS_IN_S = 1000;
  const S_IN_MIN = 60;
  const MIN_IN_HOUR = 60;
  const HOUR_IN_DAY = 24;
  const DAY_IN_YEAR = 365;
  return (
    <>
      <div>
        <div onClick={() => setYear(year + 1)}>+</div>
        <div onClick={() => setYear(year - 1)}>-</div>
      </div>
      {/* <QuotedText /> */}
      {countryToName && countries && (
        <WorldMap
          container={{
            sizePx: { x: 1024, y: 780 },
            center: [0, 0],
          }}
          contents={{
            countries,
            countryToName,
            countryLines: [],
            onClick: (id) => dataService.setSelectedCountry(id),
            highlights: [
              {
                highlightColor: "#FFFF00",
                highlightedCountries:
                  selectedCountry !== null ? [selectedCountry] : [],
              },
            ],
          }}
        />
      )}
      {countryStarts && (
        <Timeline
          // can only switch ID type bc rn we're using the same code, terrible pattern TODO
          onEventClick={(eventId) => {
            dataService.setSelectedCountry(eventId as any as CountryID);
          }}
          stageSize={{
            x: 1024,
            y: 780,
          }}
          events={countryStarts}
          // we pass in "MS since Jan 1 1970"
          yearFactor={
            1 / (DAY_IN_YEAR * HOUR_IN_DAY * MIN_IN_HOUR * S_IN_MIN * MS_IN_S)
          }
          yearOffset={1970}
        />
      )}
      <div>All visible data comes directly from WikiData</div>
      <div>Known Issues:</div>
      <p>Some founding events are doubled</p>
      <p>Event Timeline </p>
    </>
    // <div style={{ width: canvasSize.x, height: canvasSize.y }}>
    //   <div className={styles.Container}>
    //     <PanelGroup direction="vertical">
    //       <Panel
    //         defaultSize={100}
    //         className={styles.Panel}
    //         ref={timelinePanelRef}
    //       >
    //         <div className={styles.PanelContent}>
    //           <Timeline stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* TEST */}
    //       </Panel>
    //       <ResizeHandle />
    //       <Panel className={styles.Panel}>
    //         <div className={styles.PanelContent}>
    //           <Network stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* <Timeline /> */}
    //         {/* <AddNewEvent /> */}
    //       </Panel>
    //     </PanelGroup>
    //   </div>
    // </div>
  );
}
export function getIntersectionsBetween<TCountryCode extends string>(
  keyA: keyof typeof partitionA,
  keyB: keyof typeof partitionB,
  partitionA: Record<string, { highlightedCountries: TCountryCode[] }>,
  partitionB: Record<string, { highlightedCountries: TCountryCode[] }>
): CountryCode[] {
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

export default App;
