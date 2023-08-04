import { map, of } from "rxjs";
import { BuildNetwork } from "./DashboardNodes";
import { IGenericDashboardNode } from "./DashboardNodes.types";

describe("Build Dashboard", () => {
  it("dashboard nodes work as expected", () => {
    // TODO 'readable node' that sits along a
    // const PeeperNode = () => {};
    // const OutputToStateNode = () => {};

    function NotNode<TId extends string>(
      id: TId
    ): IGenericDashboardNode<
      TId,
      "Not",
      { in: { flavor: "Boolean" } },
      { out: { flavor: "Boolean" } },
      null,
      null,
      null,
      true
    > {
      return {
        id,
        type: "Not",
        inputs: { in: { flavor: "Boolean" } },
        outputs: { out: { flavor: "Boolean" } },
        functionObservable: (inputs) => {
          return inputs.pipe(
            map((val) => ({ out: { flavor: "Boolean", val: !val } }))
          );
        },
        // funcob
      };
    }
    // INITIAL BOOLEAN > NOT > NOT > INITIAL BOOLEAN OUT
    const testInterface = BuildNetwork(
      [NotNode("NOT-1"), NotNode("NOT-2")],
      [
        {
          origin: { id: "NOT-1", flavor: "Boolean", jointDataObservable: of() },
          target: { id: "NOT-2", flavor: "Boolean" },
        },
      ]
    );
    expect(testInterface).toEqual(false);
  });
});
