import { EventID, HistoricalEvent } from "react-konva-components/src";
import { Bench } from "tinybench";
import { TimeSpace } from "type-library";
import { applyFiltersToEvents } from "./eventMethods";

// --traceResolution
const bench = new Bench({ time: 100 });

bench
  .add("Apply Filters", async () => {
    const N = 1000;
    const events: HistoricalEvent[] = [...Array(N).keys()].map((ii) => ({
      id: ii as EventID,
      eventTime: ((ii * 100) / (N - 1)) as TimeSpace,
      eventName: `Test${ii}-name`,
      eventInfo: `Test${ii}-info`,
    }));

    applyFiltersToEvents(10 as TimeSpace, events, 90 as TimeSpace);
  })
  .todo("unimplemented bench");

await bench.run();

console.table(bench.table());

console.table(
  bench.todos.map(({ name }) => ({
    TODOs: name,
  }))
);
