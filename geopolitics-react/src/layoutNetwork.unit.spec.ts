import { forceDirectedGraph } from "react-konva-components/src/layoutNetwork";

describe("layout network works", () => {
  it("matches snapshot", () => {
    const placements = forceDirectedGraph({
      G: [
        [0, 1, 0, 0, 1, 0, 0, 1],
        [0, 0, 1, 1, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 1, 0, 1, 0],
      ],
      seed: "test seed",
      iterations: 5,
    });
    expect(
      placements.map((node) => ({ x: node.x, y: node.y }))
    ).toMatchSnapshot();
  });
});
