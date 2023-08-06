export const intersectSets = (a: Set<any>, b: Set<any>) =>
  new Set([...a].filter((i) => b.has(i)));
const notSet = (a: Set<any>, U: Set<any>) =>
  new Set([...U].filter((i) => !a.has(i)));
// subtract a - b
export const subtractSets = (a: Set<any>, b: Set<any>, U: Set<any>) =>
  intersectSets(a, notSet(b, U));
