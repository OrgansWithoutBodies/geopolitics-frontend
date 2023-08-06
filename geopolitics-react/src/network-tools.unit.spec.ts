import {
  adjMatToRawNetwork,
  detectConnectedComponentsFromAdjMat,
  getNeighbors,
  rawNetworkToAdjMat,
} from "react-konva-components/src/networkTools";
import { RawNetwork } from "type-library";
import { ObjectAdjacencyMatrix } from "type-library/src";
// import { ObjectAdjacencyMatrix } from "type-library";
const demoAdjMatSingleDir: ObjectAdjacencyMatrix<"10" | "11" | "12" | "13"> = {
  10: { 10: 0, 11: 1, 12: 0, 13: 0 },
  11: { 10: 0, 11: 0, 12: 0, 13: 1 },
  12: { 10: 0, 11: 0, 12: 0, 13: 1 },
  13: { 10: 0, 11: 0, 12: 0, 13: 0 },
};
const demoAdjMatMultipleDir: ObjectAdjacencyMatrix<"10" | "11" | "12" | "13"> =
  {
    10: { 10: 0, 11: 1, 12: 0, 13: 0 },
    11: { 10: 0, 11: 0, 12: 0, 13: 0 },
    12: { 10: 1, 11: 0, 12: 0, 13: 0 },
    13: { 10: 0, 11: 0, 12: 1, 13: 0 },
  };
const demoRawNetwork = {
  edges: [
    { origin: 10, target: 11 },
    { origin: 11, target: 13 },
    { origin: 12, target: 13 },
  ],
  nodes: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }],
} as RawNetwork;

describe("Network Tools", () => {
  //   it("getAdjacencies works", () => {
  //     getAdjacencies();
  //   });
  it("detectConnectedComponentsFromAdjMat works", () => {
    const fewerCommunities =
      detectConnectedComponentsFromAdjMat(demoAdjMatSingleDir);
    expect(Object.keys(fewerCommunities).length).toEqual(1);
    const demoTwoComponentNetwork = {
      edges: [
        { origin: 10, target: 11 },
        { origin: 11, target: 13 },
        { origin: 12, target: 13 },
        { origin: 20, target: 21 },
        { origin: 21, target: 23 },
        { origin: 22, target: 23 },
      ],
      nodes: [
        { id: 10 },
        { id: 11 },
        { id: 12 },
        { id: 13 },
        { id: 20 },
        { id: 21 },
        { id: 22 },
        { id: 23 },
      ],
    } as RawNetwork;
    const demoTwoComponentNetworkAdjMat = rawNetworkToAdjMat(
      demoTwoComponentNetwork
    );
    console.log("TEST123-demo", demoTwoComponentNetworkAdjMat);
    const communities = detectConnectedComponentsFromAdjMat(
      demoTwoComponentNetworkAdjMat
    );
    expect(Object.keys(communities).length).toEqual(2);
  });
  it("getNeighbors works", () => {
    const returnedNeighbors10 = getNeighbors("10", demoAdjMatSingleDir);
    expect(returnedNeighbors10).toEqual(["11"]);
    const returnedNeighbors11 = getNeighbors("11", demoAdjMatSingleDir);
    expect(returnedNeighbors11).toEqual(["10", "13"]);
    const returnedNeighbors12 = getNeighbors("12", demoAdjMatSingleDir);
    expect(returnedNeighbors12).toEqual(["13"]);
    const returnedNeighbors13 = getNeighbors("13", demoAdjMatSingleDir);
    expect(returnedNeighbors13).toEqual(["11", "12"]);
    // multipleDirs
    const returnedNeighborsD13 = getNeighbors("12", demoAdjMatMultipleDir);
    expect(returnedNeighborsD13).toEqual(["10", "13"]);
  });
  it("adjMatToRawNetwork works", () => {
    const returnedRawNetwork = adjMatToRawNetwork(demoAdjMatSingleDir);
    expect(returnedRawNetwork).toEqual(demoRawNetwork);
  });
  it("rawNetworkToAdjMat works", () => {
    const returnedAdjMat = rawNetworkToAdjMat(demoRawNetwork);
    expect(returnedAdjMat).toEqual(demoAdjMatSingleDir);
  });
});
