import { Command } from "commander";
import figlet from "figlet";
import fs from "fs";

import {
  buildQueryStringAndPost,
  getQCodeNames,
  militaryAlliances,
  minerals,
  mines,
  parties,
} from "./wd.requests";
import { QCode } from "./wd.types";

console.log(figlet.textSync("Data Builder"));

const program = new Command();
const errorLog = (details?: string) =>
  console.log("Sorry, something went wrong", details);

const availableQueries = {
  military: militaryAlliances,
  //   unMemberStates,
  //   hospitals,
  minerals,
  mines,
  parties,
};

program
  .version("1.0.0")
  //   TODO come up w better name ('OpenGeoPolitics'?)
  .description("A CLI for building data for geopolitics app")
  .option("-g, --get  [value...]", "Get data from wikidata", "all")
  .action(async ({ get }) => {
    console.log("Connecting to WikiData...");
    // make sure we can connect before trying anything

    if (![...Object.keys(availableQueries), "all"].includes(get[0])) {
      errorLog("Invalid Query Choice");
      return;
    }
    // TODO all
    console.log(get);
    const name = get as keyof typeof availableQueries;
    // TODO
    // TODO verify given values are in available/'all'
    const data = await buildQueryStringAndPost(
      Object.keys(availableQueries[name]["query"]),
      availableQueries[name].mainValue,
      availableQueries[name].query
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

    fs.writeFile(
      `out/${name}.qcodes.data.ts`,
      `export const QCodes = ${JSON.stringify(qCodeQueryResults)} as const;`,
      (err) => console.log(err)
    );
  })
  //   .option("-b, --build  [value...]", "Build data from retrieved query values")
  .parse(process.argv);

// type QCodes = typeof WDType[number][keyof typeof WDType[number]]["value"] &
//   QCode<number>;
// const options = program.opts();
