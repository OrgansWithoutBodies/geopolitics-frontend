import axios from "axios";
import { Command } from "commander";
import figlet from "figlet";
import fs from "fs";
import { sleep } from "./sleep";
import {
  buildQueryStringAndPost,
  colonies,
  countries,
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
  tradeBlocs,
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
  countries,
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
  tradeBlocs,
  // hospitals,
  // unMemberStates,
};

const intersectSets = (a: Set<any>, b: Set<any>) =>
  new Set([...a].filter((i) => b.has(i)));
program
  .version("1.0.0")
  //   TODO come up w better name ('OpenGeoPolitics'?)
  .description("A CLI for building data for geopolitics app")
  .option("-w, --wd  [value...]", "Get data from wikidata", undefined)
  .action(async ({ wd }) => {
    if (wd === undefined) {
      console.log("Please supply a query name, or '*' to get all");
      return;
    }
    console.log("Connecting to WikiData...", wd);
    // make sure we can connect before trying anything
    const safeGet =
      wd === "*" || wd === true ? Object.keys(availableQueries) : wd;
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

      // TODO formulate this better - this is where outlines come from
      if (name === "countries") {
        if (!fs.existsSync("out/countries")) {
          fs.mkdirSync("out/countries");
        }
        fs.writeFileSync(
          "out/countries/index.ts",
          `${Object.keys(qCodeQueryResults)
            .map((qcode) => {
              return `import ${qcode} from './${qcode}.outline.data.json';`;
            })
            .join("\n")}\nexport const CountryOutlines = {${Object.keys(
            qCodeQueryResults
          ).join(",")}}`
        );

        for (const country of data.validatedData) {
          const MS_IN_SEC = 1000;
          const countryOutlineURL = (country.shape as { value: string }).value
            .split("+")
            .join("%20");
          if (
            !fs.existsSync(
              `out/countries/${country.item.value}.outline.data.json`
            )
          ) {
            await sleep(2 * MS_IN_SEC);
            const countryResult = await axios.get(countryOutlineURL, {});
            if (!(countryResult["status"] === 200)) {
              // return null;
              throw new Error();
            }
            fs.writeFile(
              `out/countries/${country.item.value}.outline.data.json`,
              `${JSON.stringify(countryResult.data.data)}`,
              (err) => console.log(err)
            );
          }
        }
      }
    }
  })
  // .option("-s, --sip  [filePath]", "Parse SIPRI file", undefined)
  // .action(async ({ sip }) => {
  //   const overrideKeys: Record<string, string> = {
  //     tidn: "number",
  //     odat: "number|''|null",
  //     onum: "number|''|null",
  //     ldat: "number|''|null",
  //     tivdel: "number|''|null",
  //     tivunit: "number|''|null",
  //     tivorder: "number|''|null",
  //     delyears: "number|''|null",
  //     nrdel: "number|''|null",
  //   };
  //   // https://armstrade.sipri.org/armstrade/html/export_trade_register.php --compressed     --data 'low_year=1950'     --data 'high_year=2023'     --data 'seller_country_code='     --data 'buyer_country_code='     --data 'armament_category_id=any'     --data 'buyers_or_sellers=sellers'     --data 'filetype=csv'     --data 'include_open_deals=on'     --data 'sum_deliveries=on'     --data 'Submit4=Download'
  //   const rawData = await fsAsync.readFile(sip, { encoding: "utf8" });
  //   const formatCellType = (val: string) =>
  //     !Number.isNaN(Number.parseInt(val))
  //       ? Number.parseInt(val)
  //       : !Number.isNaN(Number.parseFloat(val))
  //       ? Number.parseFloat(val)
  //       : `${val}`;
  //   const { data } = parse(rawData) as { data: string[][] };
  //   const keys = data[0];
  //   const transformedData = data
  //     .slice(1)
  //     .map((line) =>
  //       Object.fromEntries(
  //         line.map((val, ii) => [keys[ii], formatCellType(val)])
  //       )
  //     );
  //   fs.writeFile(
  //     `out/sipri.data.ts`,
  //     `export const SIPRI = ${JSON.stringify(transformedData)}`,
  //     (err) => console.log(err)
  //   );
  //   const dataTypes = Object.fromEntries(
  //     Object.keys(transformedData[0]).map((key) => [
  //       key,
  //       key in overrideKeys
  //         ? `__PLACEHOLDER__${key}`
  //         : [...new Set(transformedData.map((line) => line[key]))],
  //     ])
  //   );
  //   fs.writeFile(
  //     `out/sipri.data.types.ts`,
  //     `export type SIPRITypes = ${Object.keys(transformedData[0]).reduce(
  //       (prev, key) => {
  //         console.log("TEST", { key, prev });
  //         return prev.replace(`"__PLACEHOLDER__${key}"`, overrideKeys[key]);
  //       },
  //       JSON.stringify(dataTypes)
  //     )}`,
  //     (err) => console.log(err)
  //   );
  // })
  // .option("-a, --aec  [filePath]", "Parse AEC data files", undefined)
  // // /home/v/Projects/Geopolitics/trade/DATA/mergedData.csv
  // .action(async ({ aec }) => {
  //   const overrideKeys: Record<string, string> = {
  //     tidn: "number",
  //     odat: "number|''|null",
  //     onum: "number|''|null",
  //     ldat: "number|''|null",
  //     tivdel: "number|''|null",
  //     tivunit: "number|''|null",
  //     tivorder: "number|''|null",
  //     delyears: "number|''|null",
  //     nrdel: "number|''|null",
  //   };
  //   // https://armstrade.sipri.org/armstrade/html/export_trade_register.php --compressed     --data 'low_year=1950'     --data 'high_year=2023'     --data 'seller_country_code='     --data 'buyer_country_code='     --data 'armament_category_id=any'     --data 'buyers_or_sellers=sellers'     --data 'filetype=csv'     --data 'include_open_deals=on'     --data 'sum_deliveries=on'     --data 'Submit4=Download'

  //   const rawData: string[][] = [];
  //   fs.readFile(aec, { encoding: "utf8" }, (err, data) =>
  //     console.log("TEST", err, data)
  //   );
  //   const formatCellType = (val: string) =>
  //     !Number.isNaN(Number.parseInt(val))
  //       ? Number.parseInt(val)
  //       : !Number.isNaN(Number.parseFloat(val))
  //       ? Number.parseFloat(val)
  //       : `${val}`;
  //   // const { data } = parse(rawData) as { data: string[][] };
  //   // const keys = data[0];
  //   // const transformedData = data
  //   //   .slice(1)
  //   //   .map((line) =>
  //   //     Object.fromEntries(
  //   //       line.map((val, ii) => [keys[ii], formatCellType(val)])
  //   //     )
  //   //   );
  //   // fs.writeFile(
  //   //   `out/AEC.data.ts`,
  //   //   `export const SIPRI = ${JSON.stringify(transformedData)}`,
  //   //   (err) => console.log(err)
  //   // );
  //   // const dataTypes = Object.fromEntries(
  //   //   Object.keys(transformedData[0]).map((key) => [
  //   //     key,
  //   //     key in overrideKeys
  //   //       ? `__PLACEHOLDER__${key}`
  //   //       : [...new Set(transformedData.map((line) => line[key]))],
  //   //   ])
  //   // );
  //   // fs.writeFile(
  //   //   `out/AEC.data.types.ts`,
  //   //   `export type SIPRITypes = ${Object.keys(transformedData[0]).reduce(
  //   //     (prev, key) => {
  //   //       console.log("TEST", { key, prev });
  //   //       return prev.replace(`"__PLACEHOLDER__${key}"`, overrideKeys[key]);
  //   //     },
  //   //     JSON.stringify(dataTypes)
  //   //   )}`,
  //   //   (err) => console.log(err)
  //   // );
  // })
  //   .option("-b, --build  [value...]", "Build data from retrieved query values")
  .parse(process.argv);

// type QCodes = typeof WDType[number][keyof typeof WDType[number]]["value"] &
//   QCode<number>;
// const options = program.opts();
