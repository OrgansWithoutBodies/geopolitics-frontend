import { Command } from "commander";
import figlet from "figlet";
import fs from "fs";

import {
  buildQueryStringAndPost,
  colonies,
  getQCodeNames,
  independenceDeclarations,
  internationalOrganizations,
  metals,
  militaryAlliances,
  minerals,
  mines,
  newsAgencies,
  parties,
  pmcs,
  railways,
  regimeChanges,
  revolutions,
  rocks,
  wars,
} from "./wd.requests";
import { QCode } from "./wd.types";

console.log(figlet.textSync("Data Builder"));

const program = new Command();
const errorLog = (details?: string) =>
  console.log("Sorry, something went wrong", details);

type AvailableQuery = {
  mainValue: `wd:${QCode<number>}`;
  includeSubclasses?: true;
  query: Record<string, any>;
};

const availableQueries: Record<string, AvailableQuery> = {
  wars,
  military: militaryAlliances,
  pmcs,
  colonies,
  rocks,
  metals,
  minerals,
  newsAgencies,
  mines,
  regimeChanges,
  internationalOrganizations,
  railways,
  independence: independenceDeclarations,
  parties,
  revolutions,
  // hospitals,
  // unMemberStates,
};

const intersectSets = (a: Set<any>, b: Set<any>) =>
  new Set([...a].filter((i) => b.has(i)));
program
  .version("1.0.0")
  //   TODO come up w better name ('OpenGeoPolitics'?)
  .description("A CLI for building data for geopolitics app")
  .option("-g, --get  [value...]", "Get data from wikidata", undefined)
  .action(async ({ get }) => {
    if (get === undefined) {
      console.log("Please supply a query name, or '*' to get all");
      return;
    }
    console.log("Connecting to WikiData...", get);
    // make sure we can connect before trying anything
    const safeGet =
      get === "*" || get === true ? Object.keys(availableQueries) : get;
    if (
      !intersectSets(
        new Set([...Object.keys(availableQueries)]),
        new Set([...safeGet])
      ).size === safeGet.length
    ) {
      errorLog("Invalid Query Choice");
      return;
    }
    console.log("Query: ", safeGet, availableQueries[safeGet]);

    for (const name of safeGet) {
      const data = await buildQueryStringAndPost(
        Object.keys(availableQueries[name].query),
        availableQueries[name].mainValue,
        availableQueries[name].query,
        availableQueries[name].includeSubclasses || false
      );

      if (data === null) {
        errorLog();
        return;
      }
      fs.writeFile(
        `out/${name}.data.ts`,
        `export const WDType = ${JSON.stringify(data.validatedData)} as const;`,
        (err) => console.log(err)
      );

      const qCodes: QCode<number>[] = [];
      data.validatedData.forEach((val) =>
        Object.values(val).forEach((element) => {
          if (
            element["type"] === "uri" &&
            (element["value"] as string).startsWith("Q")
          ) {
            // TODO no need to save datatype val
            // TODO coords to tuple
            // TODO make this typesafer
            qCodes.push(element["value"] as QCode<number>);
          }
        })
      );
      console.log(qCodes);
      const qCodeQueryResults = await getQCodeNames(qCodes);
      if (qCodeQueryResults === null) {
        errorLog();
        return;
      }

      // TODO joint qcode file

      fs.writeFile(
        `out/${name}.qcodes.data.ts`,
        `export const QCodes = ${JSON.stringify(qCodeQueryResults)} as const;`,
        (err) => console.log(err)
      );
    }
  })
  //   .option("-b, --build  [value...]", "Build data from retrieved query values")
  .parse(process.argv);

// type QCodes = typeof WDType[number][keyof typeof WDType[number]]["value"] &
//   QCode<number>;
// const options = program.opts();
