import * as asciichart from "asciichart";

import PolynomialRegression from "ml-regression-polynomial";

import Bench, { TaskResult } from "tinybench";

/**
 * "O(N) Benchmark"
 * @param nFunc
 * @param minN
 * @param maxN
 * @param stepN
 * @returns
 */
export async function ONBenchmark<TSetup>({
  nFunc,
  setupFunc,
  minN,
  maxN,
  numSteps = 100,
  iterations = 30,
}: {
  nFunc: (setupParams: TSetup) => void;
  setupFunc: (N: number) => TSetup;

  minN: number;
  maxN: number;
  numSteps?: number;
  iterations?: number;
}) {
  const stepN = Math.floor((maxN - minN) / numSteps);
  let N = minN;
  const results: [number, TaskResult][] = [];
  // const minMax: {min:number,max:number}[] = [];
  while (N < maxN) {
    // set up params before running bench
    const setupParams = setupFunc(N);

    const bench = new Bench({ time: 100, iterations });
    bench.add("bench", async () => {
      nFunc(setupParams);
    });
    await bench.run();
    results.push([N, bench.results[0]!]);
    // minMax.push([N, bench.results[0]!.mean]);
    N = N + stepN;
  }
  return results;
}

export async function performBenchTest<TSetupType>({
  nFunc,
  setupFunc,
  minN = 1,
  maxN = 100,
  numSteps = 100,
  degree = 2,
  iterations = 30,
}: TSetupType extends (setupParams: infer TSetup) => any
  ? {
      nFunc: TSetupType;
      setupFunc: (N: number) => TSetup;
      minN?: number;
      maxN?: number;
      numSteps?: number;
      degree?: number;
      iterations?: number;
    }
  : never): Promise<JSONType<"polynomialRegression">> {
  const results = await ONBenchmark({
    nFunc,
    setupFunc,
    minN,
    maxN,
    numSteps,
    iterations,
  });
  console.table(
    Object.fromEntries(results.map((val) => [val[0], val[1].mean]))
  );
  const means = results.map((val) => val[1].mean);
  // const regression = linearRegression(
  //   results.map((val) => [val[0], val[1].mean])
  // );
  const regression = new PolynomialRegression(
    results.map((val) => val[0]),
    results.map((val) => val[1].mean),
    degree
  ).toJSON();
  const maxMean = Math.max(...means);
  const minMean = Math.min(...means);
  console.log(regression);
  console.log(
    asciichart.plot(
      [
        means.map((_, ii) => {
          // return ii;
          return ((maxMean - minMean) / means.length) * ii;
        }),
        means,
      ],
      {
        colors: [asciichart.red, asciichart.blue],
        height: 20,
      }
    )
  );

  console.log(
    asciichart.plot([results.map((val) => val[1].sd)], {
      colors: [asciichart.green],
      height: 10,
    })
  );
  console.log("Blue Function, Red N, Green SD");
  return regression;
}
