/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { canvas: "jest-canvas-mock" },
  transformIgnorePatterns: ["node_modules/(?!.*.mjs$|@datorama/akita)"],
};
