import { Command } from "commander";
import figlet from "figlet";
import fs from "fs";

import {
  buildQueryStringAndPost,
  colonies,
  getQCodeNames,
  hospitals,
  metals,
  militaryAlliances,
  minerals,
  mines,
  parties,
  rocks,
  wars,
} from "./wd.requests";
import { QCode } from "./wd.types";

console.log(figlet.textSync("Data Builder"));

const program = new Command();
const errorLog = (details?: string) =>
  console.log("Sorry, something went wrong", details);

const availableQueries: Record<
  string,
  {
    mainValue: `wd:${QCode<number>}`;
    includeSubclasses?: true;
    query: Record<string, any>;
  }
> = {
  wars,
  military: militaryAlliances,
  //   unMemberStates,
  hospitals,
  colonies,
  rocks,
  metals,
  minerals,
  mines,
  parties,
};

const intersectSets = (a: Set<any>, b: Set<any>) =>
  new Set([...a].filter((i) => b.has(i)));
program
  .version("1.0.0")
  //   TODO come up w better name ('OpenGeoPolitics'?)
  .description("A CLI for building data for geopolitics app")
  .option("-g, --get  [value...]", "Get data from wikidata", "all")
  .action(async ({ get }) => {
    console.log("Connecting to WikiData...");
    // make sure we can connect before trying anything
    const safeGet =
      get === "all" || get === true ? Object.keys(availableQueries) : get;
    if (
      !intersectSets(
        new Set([...Object.keys(availableQueries), "all"]),
        new Set([...safeGet])
      ).size === safeGet.length
    ) {
      errorLog("Invalid Query Choice");
      return;
    }

    for (const name of safeGet) {
      console.log("test123", name);

      // TODO
      // TODO verify given values are in available/'all'
      const data = await buildQueryStringAndPost(
        Object.keys(availableQueries[name].query),
        availableQueries[name].mainValue,
        availableQueries[name].query,
        availableQueries[name].includeSubclasses || false
      );
      console.log("TEST123");

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
          if (element["type"] === "uri") {
            // TODO no need to save datatype val
            // TODO coords to tuple
            // TODO make this typesafer
            qCodes.push(element["value"] as QCode<number>);
          }
        })
      );
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
