import { EventID, HistoricalEvent } from "react-konva-components/src";
import { TimeSpace } from "type-library";
import { performBenchTest } from "./ONBenchmark";
import { applyFiltersToEvents } from "./eventMethods";

// https://github.com/jiayihu/pretty-algorithms
describe("DataQuery Static Methods", () => {
  // it("applyFiltersToEvents Snapshot", () => {
  //   const N = 11;
  //   const filteredEvents = filter(N);
  //   // expect(events.length).toEqual(N);
  //   expect(filteredEvents.length).toEqual(9);
  //   // expect(filteredEvents).toMatchSnapshot();
  // });
  it("applyFiltersToEvents Benchmark", async () => {
    const {
      coefficients: [offset, slope, square],
    } = await performBenchTest<(val: HistoricalEvent[]) => void>({
      nFunc: (events) =>
        applyFiltersToEvents(10 as TimeSpace, events, 90 as TimeSpace),
      setupFunc: (N) =>
        generateEvents(N, () => Math.round(Math.random() * 100) as TimeSpace),
      minN: 1,
      maxN: 1000,
      numSteps: 40,
    });
    // 0.002
    expect(offset).toBeCloseTo(0, 1);
    expect(slope).toBeCloseTo(2e-3, 2);
    expect(square).toBeCloseTo(0, 6);
  });
  // it("applyFiltersToEvents Benchmark", async () => {
  //   const { m: slope } = await performBenchTest(
  //     (N) =>
  //       [...new Array(N).keys()].map((val) => [...new Array(N + val).keys()]),
  //     1,
  //     1000,
  //     20
  //   );
  //   expect(slope).toBeCloseTo(0.002, 3);
  // });
});

// function filter(
//   N: number,
//   eventTime: (N: number, ii: number) => TimeSpace = (N, ii) =>
//     ((ii * 100) / (N - 1)) as TimeSpace
// ) {
//   const events: HistoricalEvent[] = generateEvents(N, eventTime);
//   const filteredEvents = applyFiltersToEvents(
//     10 as TimeSpace,
//     events,
//     90 as TimeSpace
//   );
//   return filteredEvents;
// }

function generateEvents(
  N: number,
  getEventTime: (N: number, ii: number) => TimeSpace
): HistoricalEvent[] {
  return [...Array(N).keys()].map((ii) => ({
    id: ii as EventID,
    eventTime: getEventTime(N, ii),
    eventName: `Test${ii}-name`,
    eventInfo: `Test${ii}-info`,
  }));
}
