import { buildQueryString } from "./buildQuery";

export const demoQuerySpec = {
  mainValue: "wd:Q12345",
  includeSubclasses: true,
  query: [
    {
      sourceKey: "item",
      prefix: "wdt",
      pCode: "P123",
      valueKey: "subItem",
      joinChar: ".",
      optional: false,
    },
  ],
} as const;

describe("Query String Builder", () => {
  it("matches snapshot", () => {
    const keyList = demoQuerySpec.query.map((val) => val.valueKey);
    const mainValueKey = demoQuerySpec.mainValue;
    const valueMaps = demoQuerySpec.query;
    const includeSubclasses = demoQuerySpec.includeSubclasses || false;
    const queryString = buildQueryString(
      keyList as readonly string[],
      mainValueKey,
      valueMaps,
      includeSubclasses
    );
    expect(queryString).toMatchSnapshot();
  });
});
