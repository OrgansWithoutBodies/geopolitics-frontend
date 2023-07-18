export const parties = `SELECT ?item ?country ?ideology ?start ?end
WHERE {
?item wdt:${INSTANCE_OF} wd:Q7278 .
OPTIONAL{?item wdt:P576 ?end .}
OPTIONAL{?item wdt:P571 ?start .}
OPTIONAL{?item wdt:P1142 ?ideology .}
?item wdt:P17 ?country .
}` as const;
declare function testParties(
  party: QueryString<
    DBResults2NF,
    ["country", "ideology", "start", "end"],
    "wd:Q7278",
    {
      country: {
        sourceKey: "item";
        pCode: "P17";
        valueKey: "?country";
        joinChar: ".";
        optional: false;
      };
      ideology: {
        sourceKey: "item";
        pCode: "P1142";
        valueKey: "?ideology";
        joinChar: ".";
        optional: true;
      };
      start: {
        sourceKey: "item";
        pCode: "P571";
        valueKey: "?start";
        joinChar: ".";
        optional: true;
      };
      end: {
        sourceKey: "item";
        pCode: "P576";
        valueKey: "?end";
        joinChar: ".";
        optional: true;
      };
    }
  >
): any;

testParties(parties);
