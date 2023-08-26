import axios from "axios";
import { Command } from "commander";
import figlet from "figlet";
import fs from "fs";
import { ArrV2 } from "type-library/src";
import { getQCodeNames } from "./buildQCodeQuery";
import {
  ValidatedTypes,
  buildQueryStringAndPost,
  wikiDataGeoShapeBaseURL,
  wikiDataGeoShapeSuffix,
} from "./buildQuery";
import { sleep } from "./sleep";
import {
  colonies,
  countries,
  dependentTerritories,
  disputedTerritories,
  geopoliticalGroups,
  hospitals,
  independenceDeclarations,
  intergovernmentalOrganizations,
  internationalOrganizations,
  lifeExpectanciesForCountries,
  limitedRecognitionStates,
  metals,
  militaryAlliances,
  minerals,
  mines,
  newsAgencies,
  newspaper,
  parties,
  pmcs,
  railways,
  regimeChanges,
  revolutions,
  rocks,
  tradeBlocs,
  wars,
} from "./wd.requests";
import { AvailableQuery, QCode } from "./wd.types";

enum TerminalColors {
  NC = "\x1b[0m",
  "Default" = "\x1b[39m",
  "Black" = "\x1b[30m",
  "Dark red" = "\x1b[31m",
  "Dark green" = "\x1b[32m",
  "Dark yellow (Orange-ish)" = "\x1b[33m",
  "Dark blue" = "\x1b[34m",
  "Dark magenta" = "\x1b[35m",
  "Dark cyan" = "\x1b[36m",
  "Light gray" = "\x1b[37m",
  "Dark gray" = "\x1b[90m",
  "Red" = "\x1b[91m",
  "Green" = "\x1b[92m",
  "Orange" = "\x1b[93m",
  "Blue" = "\x1b[94m",
  "Magenta" = "\x1b[95m",
  "Cyan" = "\x1b[96m",
  "White" = "\x1b[97m",
}
enum TerminalWeights {
  "Bold" = "\x1b[1m",
}

function buildServiceLog(
  serviceString: string,
  color: TerminalColors,
  args: Parameters<typeof console.log>
) {
  console.log(
    `${TerminalWeights.Bold}[${color}${serviceString}${TerminalColors.NC}]${TerminalWeights.Bold}::${TerminalColors.NC}${args[0]}`,
    args[1]
  );
}

export function wdLog(...args: Parameters<typeof console.log>) {
  buildServiceLog("WD", TerminalColors.Red, args);
}
console.log(
  `${TerminalWeights.Bold}${TerminalColors.Green}${figlet.textSync(
    "Data Builder"
  )}${TerminalColors.NC}`
);
const MS_IN_SEC = 1000;

const program = new Command();
const errorLog = (details?: string) =>
  console.log("Sorry, something went wrong", details);

const availableQueries: Record<string, AvailableQuery> = {
  wars,
  military: militaryAlliances,
  pmcs,
  colonies,
  rocks,
  metals,
  minerals,
  newspaper,
  newsAgencies,
  mines,
  regimeChanges,
  railways,
  independence: independenceDeclarations,
  parties,
  revolutions,
  hospitals,
  countries,
  internationalOrganizations,
  dependentTerritories,
  disputedTerritories,
  limitedRecognitionStates,
  tradeBlocs,
  intergovernmentalOrganizations,
  geopoliticalGroups,
  lifeExpectanciesForCountries,
  // unMemberStates,
};
// const intersectSets = (a: Set<any>, b: Set<any>) =>
//   new Set([...a].filter((i) => b.has(i)));
program
  .version("1.0.0")
  //   TODO come up w better name ('OpenGeoPolitics'?)
  .description("A CLI for building data for geopolitics app")
  .option("-w, --wd  [value]", "Get data from wikidata", undefined)
  .action(async ({ wd }) => {
    if (wd === undefined) {
      wdLog("Please supply a query name, or '*' to get all");
      return;
    }
    // make sure we can connect before trying anything
    const safeGet =
      wd === "*" || wd === true ? Object.keys(availableQueries) : [wd];
    // TODO
    // if (
    //   !intersectSets(
    //     new Set([...Object.keys(availableQueries)]),
    //     new Set([...safeGet])
    //   ).size === safeGet.length
    // ) {
    //   errorLog("Invalid Query Choice");
    //   return;
    // }
    wdLog("Preparing WikiData Requests...", safeGet);

    for (const name of safeGet) {
      wdLog(
        "Running",
        `${TerminalColors.Orange}${TerminalWeights.Bold}${name}${TerminalColors.NC}`
      );
      await runWDForSingleQuery(name);
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
async function runWDForSingleQuery(name: string) {
  const data = await buildQueryStringAndPost(
    availableQueries[name].query
      .filter((val) => !val.intermediate)
      .map((val) => val.valueKey),
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
    (err) => wdLog("Error Writing Data File", err)
  );

  const qCodes: QCode<number>[] = [];
  data.validatedData.forEach((val) =>
    Object.keys(val).forEach((key) => {
      const element = val[key];
      // TODO very sloppy
      if (
        key !== "territoryClaimedBy" &&
        element["type"] === ValidatedTypes.QCode
      ) {
        // TODO no need to save datatype val
        // TODO coords to tuple
        // TODO make this typesafer
        qCodes.push(element["value"] as QCode<number>);
      }
    })
  );
  // console.log(qCodes);
  const qCodeQueryResults = await getQCodeNames([...new Set(qCodes)]);
  if (qCodeQueryResults === null) {
    errorLog();
    return;
  }

  // TODO joint qcode file?

  // console.log("TEST123", qCodeQueryResults);
  fs.writeFile(
    `out/${name}.qcodes.data.ts`,
    `export const QCodes = ${JSON.stringify(qCodeQueryResults)} as const;`,
    (err) => wdLog("Error Writing QCode Data File", err)
  );

  // TODO formulate this better - this is where outlines come from
  if (
    name === "countries" ||
    name === "limitedRecognitionStates" ||
    name === "dependentTerritories" ||
    name === "disputedTerritories"
  ) {
    buildOutlineIndex(name, qCodeQueryResults);

    for (const country of data.validatedData) {
      await buildOutline(country, name);
    }
  }
}
function buildOutlineIndex(
  name: string,
  qCodeQueryResults: { [k: string]: string }
) {
  if (!fs.existsSync(`out/${name}`)) {
    fs.mkdirSync(`out/${name}`);
  }
  fs.writeFileSync(
    `out/${name}/index.ts`,
    `${Object.keys(qCodeQueryResults)
      .map((qcode) => {
        return `import ${qcode} from './${qcode}.outline.data.json';`;
      })
      .join("\n")}\nexport const CountryOutlines = {${Object.keys(
      qCodeQueryResults
    ).join(",")}}`
  );
}

async function buildOutline(country: { [k: string]: any }, name: string) {
  const countryOutlineURL = `${wikiDataGeoShapeBaseURL}${country.shape.value
    .split("+")
    .join("%20")}${wikiDataGeoShapeSuffix}`;
  if (!fs.existsSync(`out/${name}/${country.item.value}.outline.data.json`)) {
    await sleep(2 * MS_IN_SEC);
    const { data: countryResult, status } = await axios.get<{
      data: { geometries: { coordinates: ArrV2[][][] }[] };
    }>(countryOutlineURL, {});
    if (!(status === 200)) {
      // return null;
      throw new Error();
    }
    wdLog(
      "TESTURL",
      countryResult.data.geometries.map(({ coordinates }) => coordinates)
    );
    // const diffCoords = countryResult.data.geometries.map((geometry) =>
    //   geometry.coordinates.map((features) =>
    //     features.map((feature) => differentiate(feature))
    //   )
    // );
    fs.writeFile(
      `out/${name}/${country.item.value}.outline.data.json`,
      `${JSON.stringify(
        // {
        // ...countryResult.data,
        countryResult.data
        // geometries: [
        //   ...countryResult.data.geometries.map((geometry) => ({
        //     ...geometry,
        //     coordinates: [[[diffCoords]]],
        // }
      )}`,
      (err) => wdLog("Error Writing Outline Data File", err)
    );
  }
}
