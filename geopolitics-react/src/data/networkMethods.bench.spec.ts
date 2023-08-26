import {
  detectConnectedComponentsFromAdjMat,
  findRestOfComponent,
} from "react-konva-components/src/networkTools";
import { ObjectAdjacencyMatrix } from "type-library/src";
import { performBenchTest } from "./ONBenchmark";
describe("Network Methods", () => {
  it("detectConnectedComponentsFromAdjMat Benchmark", async () => {
    const {
      coefficients: [offset, slope, square],
    } = await performBenchTest<
      (val: ObjectAdjacencyMatrix<string, 0 | 1>) => void
    >({
      nFunc: (setupParams) =>
        // TODO setup is affecting timing...maybe have a separate setup step that goes before timer starts?
        detectConnectedComponentsFromAdjMat(setupParams),
      setupFunc: (N) =>
        Object.fromEntries(
          [...new Array(N).keys()].map((ii) => [
            `${ii}`,
            Object.fromEntries(
              [...new Array(N).keys()].map(
                (jj) =>
                  [`${jj}`, Math.random() > 0.5 ? 1 : 0] as [string, 0 | 1]
              )
            ),
          ])
        ),
      minN: 1,
      maxN: 200,
      numSteps: 30,
      degree: 3,
      iterations: 40,
    });

    expect(offset).toBeCloseTo(0, 1);
    expect(slope).toBeCloseTo(2e-3, 2);
    expect(square).toBeCloseTo(4e-4, 4);
  });
  it("findRestOfComponent Benchmark", async () => {
    const {
      coefficients: [offset, slope, square],
    } = await performBenchTest<
      (val: ObjectAdjacencyMatrix<string, 0 | 1>) => void
    >({
      nFunc: (setupParams) =>
        // TODO setup is affecting timing...maybe have a separate setup step that goes before timer starts?
        findRestOfComponent(setupParams, `${0}`),
      setupFunc: (N) =>
        Object.fromEntries(
          [...new Array(N).keys()].map((ii) => [
            `${ii}`,
            Object.fromEntries(
              [...new Array(N).keys()].map(
                (jj) =>
                  [`${jj}`, Math.random() > 0.5 ? 1 : 0] as [string, 0 | 1]
              )
            ),
          ])
        ),
      minN: 1,
      maxN: 200,
      numSteps: 30,
      degree: 3,
      iterations: 40,
    });

    expect(offset).toBeCloseTo(0, 1);
    expect(slope).toBeCloseTo(2e-3, 2);
    expect(square).toBeCloseTo(4e-4, 4);
  });
});
