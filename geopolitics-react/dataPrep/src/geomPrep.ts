export function linearizePoints(points: [number, number][]) {
  points;
}

export function differentiate(points: [number, number][]) {
  return points.map((point, ii) => {
    if (ii === 0) {
      return point;
    }
    const prevPoint = points[ii - 1];
    return [point[0] - prevPoint[0], point[1] - prevPoint[1]];
  });
}
export function integrate(diffPoints: [number, number][]) {
  return diffPoints.map((point, ii) => {
    if (ii === 0) {
      return point;
    }
    const prevPoint = diffPoints[ii - 1];
    return [point[0] + prevPoint[0], point[1] + prevPoint[1]];
  });
}
