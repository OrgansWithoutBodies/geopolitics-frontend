// TODO flexible enough for non-hardcoded values (useContext?)
export const orderedNumbers = (length: number): number[] => [
  ...Array.from({ length }).keys(),
];
