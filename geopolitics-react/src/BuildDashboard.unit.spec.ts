import { of } from "rxjs";
import { BuildNetwork } from "./DashboardNodes";
import { IGenericDashboardNode } from "./DashboardNodes.types";

describe("Build Dashboard", () => {
  it("dashboard nodes work as expected", () => {
    // TODO 'readable node' that sits along a
    // const PeeperNode = () => {};
    // const OutputToStateNode = () => {};
    const NotNode: IGenericDashboardNode<
      "Not",
      { in: { flavor: "Boolean" } },
      { out: { flavor: "Boolean" } }
    > = {
      type: "Not",
      inputs: { in: { flavor: "Boolean" } },
      outputs: { out: { flavor: "Boolean" } },
      options: {},
      Component: {} as IGenericDashboardNode<
        "Not",
        { in: { flavor: "Boolean" } },
        { out: { flavor: "Boolean" } }
      >["Component"],
    };
    // INITIAL BOOLEAN > NOT > NOT > INITIAL BOOLEAN OUT
    const testInterface = BuildNetwork(
      [NotNode, NotNode],
      [
        {
          origin: { flavor: "testA", jointDataObservable: of() },
          target: { flavor: "testB" },
        },
      ]
    );
    expect(testInterface).toEqual(false);
  });
});
