import { ImperativePanelHandle } from "react-resizable-panels";

import { useEffect, useRef, useState } from "react";
import { countryInfo } from "./countryData";
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
  // const ref = useRef<ImperativePanelGroupHandle>(null);

  // const resetLayout = () => {
  //   const panelGroup = ref.current;
  //   if (panelGroup) {
  //     // Reset each Panel to 50% of the group's width
  //     panelGroup.setLayout([50, 50]);
  //   }
  // }
  // type MembershipStatus = "current" | "applied" | "interest";
  const timelinePanelRef = useRef<ImperativePanelHandle>(null);
  // const [paneSize, setPaneSize] = useState<number | null>(null);
  useEffect(() => {
    if (timelinePanelRef.current) {
      // setPaneSize(timelinePanelRef.current.getSize());
    }
  }, [timelinePanelRef.current?.getSize]);
  // const canvasSize: ObjV2 = { x: 1000, y: 300 };
  // const regionColorMap: RegionColorMap = {
  //   Africa: "green",
  //   Americas: "yellow",
  //   Antarctica: "white",
  //   Asia: "blue",
  //   Europe: "cyan",
  //   Oceania: "red",
  // };
  const [year, setYear] = useState(2000);
  // const mapCountryData = (
  //   key: CountryInfoKey<typeof countryInfo>,
  //   value: CountryInfoKey<typeof countryInfo>
  // ) =>
  //   Object.fromEntries(
  //     countryInfo.map((country) => [country[key], country[value]])
  //   );
  // const countryToRegion = mapCountryData(
  //   "alpha-3",
  //   "region"
  // ) as CountryRegionLookup<CountryCode>;
  // const countryToName = mapCountryData(
  //   "alpha-3",
  //   "name"
  // ) as CountryNameLookup<CountryCode>;
  return (
    <>
      <div>
        <div onClick={() => setYear(year + 1)}>+</div>
        <div onClick={() => setYear(year - 1)}>-</div>
      </div>
      {/* <QuotedText /> */}
      {/* <WorldMap<CountryCode>
        container={{
          sizePx: { x: 1024, y: 780 },
          center: [0, 0],
        }}
        contents={{
          countries: Object.entries(CountryFiles).map(([key, geometry]) => ({
            key,
            geometry,
          })),


          ],
          countryToRegion,
          countryToName,
          regionColorMap,
          // bilateralRelations,
          countryHeartMap: Capitals,
        }}
      /> */}
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
// const PanelStyles: Record<string, React.CSSProperties> = {
//   container: {
//     height: "100%",
//     width: "100%",
//     display: "flex",
//     flexDirection: "row",
//     alignItems: " center",
//     justifyContent: " center",
//     overflow: "hidden",
//     borderRadius: " 0.5rem",
//   },
// };
