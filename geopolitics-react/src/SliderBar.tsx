// import { useState } from "react";
// import { Circle, Group, Layer, Rect, Stage } from "react-konva";
// import { ArrV2, ObjV2 } from "type-library";

// export function normalize(
//   val: number,
//   initialRange: ArrV2,
//   mappedRange: ArrV2
// ) {
//   const ratioAlongInitialRange =
//     (val - initialRange[0]) / (initialRange[1] - initialRange[0]);
//   const sizeOfMappedRange = mappedRange[1] - mappedRange[0];
//   return ratioAlongInitialRange * sizeOfMappedRange + mappedRange[0];
// }
// function SliderHandle({
//   val,
//   setVal,
//   edgeBufferPercX,
//   stageSize,
// }: {
//   val: number;
//   setVal: (val: number) => void;
//   edgeBufferPercX: number;
//   stageSize: ObjV2;
// }) {
//   const linePosY = stageSize.y / 2;

//   const mapPercToPixels = (perc: number) =>
//     normalize(
//       perc,
//       [0, 1],
//       [edgeBufferPercX * stageSize.x, stageSize.x * (1 - edgeBufferPercX)]
//     );
//   const mapPixelsToPerc = (pix: number) =>
//     normalize(
//       pix,
//       [edgeBufferPercX * stageSize.x, stageSize.x * (1 - edgeBufferPercX)],
//       [0, 1]
//     );

//   return (
//     <Circle
//       draggable
//       fill="red"
//       y={linePosY}
//       radius={10}
//       dragBoundFunc={(pos) => ({
//         x: mapPercToPixels(Math.max(Math.min(mapPixelsToPerc(pos.x), 1), 0)),
//         y: linePosY,
//       })}
//       onDragMove={(event) => {
//         setVal(mapPixelsToPerc(event.target.x()));
//         event.target.stopDrag();
//       }}
//       x={mapPercToPixels(val)}
//     />
//   );
// }
// export function SliderBar({
//   handlePercs: { high, low },
//   stageSize,
// }: {
//   handlePercs: { high: number; low: number };
//   stageSize: ObjV2;
// }): JSX.Element {
//   const [newHigh, setHigh] = useState<number>(high);
//   const [newLow, setLow] = useState<number>(low);
//   const edgeBufferPercX = 0.05;
//   const edgeBufferPercY = 0.15;
//   return (
//     <Stage
//       width={stageSize.x}
//       height={stageSize.y}
//       style={{
//         backgroundColor: "white",
//         width: stageSize.x,
//         height: stageSize.y,
//       }}
//     >
//       <Layer>
//         <Group>
//           <Rect
//             fill="green"
//             width={stageSize.x * (1 - 2 * edgeBufferPercX)}
//             height={stageSize.y * (1 - 2 * edgeBufferPercY)}
//             x={edgeBufferPercX * stageSize.x}
//             y={edgeBufferPercY * stageSize.y}
//             cornerRadius={40}
//           />
//           {/* <Path
//             width={stageSize.x}
//             height={stageSize.y}
//             fill="green"
//             data={
//               "m 163.7168,154.79102 c 0,0 -51.89063,3.84807 -51.89063,87.75976 v 8.78516 c 0,83.91169 51.89063,87.75976 51.89063,87.75976 h 357.58008 c 0,0 51.89062,-3.84807 51.89062,-87.75976 v -8.78516 c 0,-83.91169 -51.89062,-87.75976 -51.89062,-87.75976 z"
//             }
//           /> */}
//           <Group>
//             <SliderHandle
//               val={newLow}
//               setVal={(val) => {
//                 if (val < newHigh) {
//                   setLow(val);
//                 }
//               }}
//               edgeBufferPercX={edgeBufferPercX}
//               stageSize={stageSize}
//             />
//             <SliderHandle
//               val={newHigh}
//               setVal={(val) => {
//                 if (val > newLow) {
//                   console.log("test123-comp", val, newLow);
//                   setHigh(val);
//                 }
//               }}
//               edgeBufferPercX={edgeBufferPercX}
//               stageSize={stageSize}
//             />
//           </Group>
//         </Group>
//       </Layer>
//     </Stage>
//   );
// }
