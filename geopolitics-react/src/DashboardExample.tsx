// import { LinePlot, Network, Timeline, WorldMap } from "react-konva-components/src";
// import { ArrV2, HexString, TimeSpace } from "type-library";
// import { dataService } from "./data/data.service";
// import { CountryID } from "./data/data.store";
// import { MS_IN_YEAR, unoffsetDate } from "./timeTools";

// export function Dashboard1():JSX.Element{
//   return    <>
//   {filterYearsRenderReady !== undefined && (
//     <div>
//       <div>
//         <p>START YEAR</p>
//         <button
//           onClick={() =>
//             dataService.setFilterEndpoint(
//               "start",
//               filterYearsNullSafe.start + 1 * MS_IN_YEAR
//             )
//           }
//         >
//           +
//         </button>
//         <input
//           value={filterYearsRenderReady.start}
//           onChange={(val) => {
//             dataService.setFilterEndpoint(
//               "start",
//               unoffsetDate(Number.parseInt(val.target.value) as TimeSpace)
//             );
//           }}
//         />
//         <button
//           onClick={() =>
//             dataService.setFilterEndpoint(
//               "start",
//               filterYearsNullSafe.start - 1 * MS_IN_YEAR
//             )
//           }
//         >
//           -
//         </button>
//       </div>
//       <div>
//         <p>END YEAR</p>
//         <button
//           onClick={() =>
//             dataService.setFilterEndpoint(
//               "end",
//               filterYearsNullSafe.end + 1 * MS_IN_YEAR
//             )
//           }
//         >
//           +
//         </button>
//         <input
//           value={filterYearsRenderReady.end}
//           onChange={(val) => {
//             dataService.setFilterEndpoint(
//               "end",
//               unoffsetDate(Number.parseInt(val.target.value) as TimeSpace)
//             );
//           }}
//         />
//         <button
//           onClick={() =>
//             dataService.setFilterEndpoint(
//               "end",
//               filterYearsNullSafe.end - 1 * MS_IN_YEAR
//             )
//           }
//         >
//           -
//         </button>
//       </div>
//       </div>
//   )}
//   <LinePlot
//     stageSize={{ x: COLUMN_1_WIDTH, y: 200 }}
//     data={[
//       {
//         points: [...Array(100).keys()].map(
//           (ii) => [ii / 2, 10 * Math.sin(ii / 2)] as ArrV2
//         ),
//         color: highlightedPlot === 0 ? "#FFFF00" : ("#FF0000" as HexString),
//       },
//       {
//         points: [...Array(100).keys()].map(
//           (ii) => [ii / 2, -10 * Math.sin(ii / 2)] as ArrV2
//         ),
//         color: highlightedPlot === 1 ? "#FFFF00" : ("#0000FF" as HexString),
//       },
//     ]}
//     centerPoint={{ x: -COLUMN_1_WIDTH / 2, y: 0 }}
//     // centerPoint={{ x: 0, y: 0 }}
//     plotRange={{
//       min: {
//         x: 0,
//         y: -10,
//       },
//       max: {
//         x: 100,
//         y: 10,
//       },
//     }}
//     onSelect={setHighlightedPlot}
//   />
//   {/* <SliderBar
//     handlePercs={{ low: 0, high: 1 }}
//     stageSize={{
//       x: COLUMN_1_WIDTH,
//       y: TIMELINE_HEIGHT / 2,
//     }}
//   /> */}
//   <div style={{ display: "flex", flexDirection: "row" }}>
//     <div style={{ display: "flex", flexDirection: "column" }}>
//       {/* <QuotedText /> */}
//       {countryToName && countries && (
//         <div>
//           <WorldMap
//             container={{
//               sizePx: { x: COLUMN_1_WIDTH, y: MAP_HEIGHT },
//               center: [0, 0],
//             }}
//             contents={{
//               countries,
//               countryToName,
//               countryHeartMap,
//               countryNodeColors: nodeColorLookup,
//               countryLines: bilateralRelations,
//               onClick: (id) =>
//                 dataService.setSelectedCountry(id as CountryID),
//               highlights: [
//                 {
//                   highlightColor: "#FFFF00",
//                   highlightedCountries:
//                     selectedCountry !== null ? [selectedCountry] : [],
//                 },
//               ],
//             }}
//           />
//         </div>
//       )}
//       {countryStarts && (
//         <Timeline
//           // can only switch ID type bc rn we're using the same code, terrible pattern TODO
//           onEventClick={(eventId) => {
//             dataService.setSelectedCountry(eventId as any as CountryID);
//           }}
//           stageSize={{
//             x: COLUMN_1_WIDTH,
//             y: TIMELINE_HEIGHT,
//           }}
//           events={countryStarts}
//           // we pass in "MS since Jan 1 1970"
//         />
//       )}
//     </div>
//     {true && (
//       <Network
//         nodes={nodes}
//         edges={edges}
//         stageSize={{
//           x: COLUMN_2_WIDTH,
//           y: TIMELINE_HEIGHT + MAP_HEIGHT,
//         }}
//         NodeTemplate={NodeTemplate}
//       />
//     )
//     }
//     </>
// }
