/**
 * Force directed graph layout algorithm according to Fruchterman and Reingold's principle.
 * The algorithm can be summarized as follows:
 * algorithm SPRING(G:graph);
 * place vertices of G in random locations;
 * repeat N times
 *     calculate the force on each vertex;
 *     move the vertex c4
 * draw graph on canvas, plotter or any drawing tool.
 *
 * Source: http://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
 */

import { AdjacencyMatrix, KonvaSpace, ObjV2 } from "./types";

interface IVector2D extends ObjV2<KonvaSpace> {
  length: number;
  assign: (v: IVector2D) => IVector2D;
  Plus: (v: IVector2D) => IVector2D;
  Min: (v: IVector2D) => IVector2D;
  divide: (n: number) => IVector2D;
  times: (n: number) => IVector2D;
}

// Vector two hold the x and y position of a Node
const Vector2D = (x: number, y: number): IVector2D => ({
  x: x as KonvaSpace,
  y: y as KonvaSpace,
  length: Math.sqrt(x ** 2 + y ** 2), //Calculate the length of a Vector
  Min: function (v: IVector2D): IVector2D {
    return Vector2D((this.x - v.x) as KonvaSpace, (this.y - v.y) as KonvaSpace);
  },
  Plus: function (v: IVector2D): IVector2D {
    return Vector2D((this.x + v.x) as KonvaSpace, (this.y + v.y) as KonvaSpace);
  },
  assign: function (v: IVector2D): IVector2D {
    return v;
  },
  divide: function (n: number): IVector2D {
    return Vector2D((this.x / n) as KonvaSpace, (this.y / n) as KonvaSpace);
  },
  times: function (n: number): IVector2D {
    return Vector2D((this.x * n) as KonvaSpace, (this.y * n) as KonvaSpace);
  },
});

// The AdjacencyMatrix is represented as a 2D Array of numbers(-1, 1, 1)
// 1 is to indicate that there is an Edge between two nodes
// 0 means no Edge
// -1 Means there is an Edge in the opposite direction

type GraphLayout = IVector2D[];

type Edge = {
  from: number;
  to: number;
};

// Get a list of Edges from the matrix, the indexes of the nodes are stored in to and from
const getEdges = (G: AdjacencyMatrix): Edge[] => {
  return G.flatMap((row, rowIndex) => {
    return row.reduce((xs, x, columnIndex) => {
      if (x == 1) {
        return xs.concat({ from: rowIndex, to: columnIndex });
      }
      return xs;
    }, Array<Edge>());
  });
};

type DirectedGraphGenerator = (props: {
  G: AdjacencyMatrix;
  W?: number;
  H?: number;
  iterations?: number;
  edge_length?: number;
}) => GraphLayout;
// You can tweak the algorithm by changing the edge length or the number of iterations
export const forceDirectedGraph: DirectedGraphGenerator = ({
  G,
  W = 1000,
  H = 1000,
  iterations = 50,
  edge_length,
}) => {
  const area = W * H;
  const edges = getEdges(G);
  const k = edge_length == undefined ? Math.sqrt(area / G.length) : edge_length; //maximum distance of the nodes
  const fa = (x: number): number => x ** 2 / k; // Formula to calculate attractive forces
  const fr = (x: number): number => k ** 2 / x; // Formula to calculate repulsive forces

  // give all nodes an initial position
  const positions = G.map((_) =>
    Vector2D(Math.ceil(Math.random() * W), Math.ceil(Math.random() * H))
  );
  const displacements = G.map((_) => Vector2D(0, 0));

  let t = W / 10;
  const dt = t / (iterations + 1);

  console.log(`area: ${area}`);
  console.log(`k: ${k}`);
  console.log(`t: ${t}, dt: ${dt}`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`Iteration: ${i}`);

    // Calculate repulsive forces
    G.forEach((v, indexV) => {
      displacements[indexV] = Vector2D(0, 0);
      G.forEach((u, indexU) => {
        if (indexU != indexV) {
          const delta = positions[indexV].Min(positions[indexU]);
          if (delta.length != 0) {
            displacements[indexV] = displacements[indexV].Plus(
              delta.divide(delta.length).times(fr(delta.length))
            );
          }
        }
      });
    });

    // Calculate attractive forces
    edges.forEach((edge) => {
      const delta = positions[edge.to].Min(positions[edge.from]);
      if (delta.length != 0) {
        displacements[edge.to] = displacements[edge.to].Min(
          delta.divide(delta.length).times(fa(delta.length))
        );
        displacements[edge.from] = displacements[edge.from].Plus(
          delta.divide(delta.length).times(fa(delta.length))
        );
      }
    });

    // limit max displacement
    G.forEach((node, index) => {
      positions[index] = positions[index].Plus(
        displacements[index]
          .divide(displacements[index].length)
          .times(Math.min(displacements.length, t))
      );
      positions[index].x = Math.min(
        W / 2,
        Math.max(-W / 2, positions[index].x)
      ) as KonvaSpace;
      positions[index].y = Math.min(
        H / 2,
        Math.max(-H / 2, positions[index].y)
      ) as KonvaSpace;
    });

    // reduce the temperature as the layout approaches a better conﬁguration
    t -= dt;
  }

  console.log("Done...", positions);

  return positions; //.map(vector => vector.Plus(Vector2D(200, 200))) // When graph out of screen you can manually map the positions
};
