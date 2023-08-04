// THIS COMPONENT IS TODO
// import Konva from "konva";
// /// <reference path="react-marker" />
// import { Keywords } from "react-marker";
// import { Quotation } from ".";

// export function QuotedText({}: {}): JSX.Element {
//   const quotes: Quotation[] = [
//     {
//       sections: [{ sectionSpan: { start: 0, end: 9 }, replacements: [] }],
//       source: "https://www.lipsum.com/",
//       sourceText:
//         "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
//     },
//   ];
//   const charIndexInSection = (charIndex: number): boolean =>
//     quotes[0].sections.find(
//       ({ sectionSpan }) =>
//         sectionSpan.start >= charIndex && sectionSpan.end <= charIndex
//     ) !== undefined;
//   const spans = quotes[0].sections.map(({ sectionSpan }) => sectionSpan);
//   // const spanPositions = spans.map(Konva.Text);
//   const textProps = {
//     padding: 100,
//     align: "center",
//     width: 1000,
//     fontFamily: "Arial",
//     fontSize: 30,
//     x: 0,
//     y: 0,
//   };
//   const dummyText = new Konva.Text({
//     ...textProps,
//     text: quotes[0].sourceText.slice(0, 100),
//   });
//   const numLines = dummyText.textArr.length;
//   console.log("TEST123", dummyText.textArr[numLines - 1].width);
//   return (
//     // <Stage width={1000} height={800} style={{ backgroundColor: "white" }}>
//     //   <Layer>
//     //     {/* {[...Array.from({ length: quotes[0].sourceText.length }).fill(0)].map(
//     //       (_, ii) => { */}
//     //     {/* return ( */}
//     //     <Text
//     //       {...textProps}
//     //       text={quotes[0].sourceText}
//     //       // fill={charIndexInSection(ii) ? "blue" : "green"}
//     //     ></Text>
//     //     <Rect
//     //       x={dummyText.x}
//     //       y={dummyText.y}
//     //       fill="red"
//     //       width={3}
//     //       height={3}
//     //     ></Rect>
//     //     {/* );
//     //       }
//     //     )} */}
//     //   </Layer>
//     // </Stage>

//     <Keywords text={quotes[0].sourceText} maxKeywords={8} color="mistyrose" />
//   );
// }
