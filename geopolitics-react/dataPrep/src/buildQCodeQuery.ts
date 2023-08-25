import axios, { AxiosResponse } from "axios";
import { defaultUrl } from "./buildQuery";
import { wdLog } from "./main";
import { QCode } from "./wd.types";

export interface QCodeResult {
  item: {
    type: "uri";
    value: `http://www.wikidata.org/entity/${QCode<number>}`;
  };
  itemLabel: {
    "xml:lang": "en";
    type: "literal";
    value: string;
  };
}
export function ValidateQCodes(results: QCodeResult[]): {
  [k: string]: string;
} {
  return Object.fromEntries(
    results.map((val) => {
      const splitVal = val["item"]["value"].split("/");
      return [splitVal[splitVal.length - 1], val["itemLabel"]["value"]];
    })
  );
  // return array(object<Struct<TDatum>>({}));
}

export async function getQCodeNames(qCodes: QCode<number>[], url = defaultUrl) {
  const chunkSize = 500;
  const numChunks = Math.ceil(qCodes.length / chunkSize);
  let currentResults: QCodeResult[] = [];
  let currentChunk = 0;
  // console.log(result.data);
  const resultIsOk = (
    res: AxiosResponse<{
      results: {
        bindings: QCodeResult[];
      };
    }>
  ) => {
    return res["status"] === 200;
  };
  // TODO im sure theres a better way to lookup that wouldnt need to be batched. I dont know it
  while (currentChunk < numChunks) {
    const query = buildQueryForQCodeNames(
      qCodes.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize)
    );

    const result = await axios.get<{ results: { bindings: QCodeResult[] } }>(
      url,
      {
        params: { query, format: "json" },
      }
    );
    if (!resultIsOk(result)) {
      return null;
    }
    currentResults = [...currentResults, ...result.data["results"]["bindings"]];
    currentChunk += 1;
    wdLog(`Got chunk ${currentChunk} of ${numChunks}`);
    // add a wait to prevent angering the wikidata gods
    await new Promise((r) => setTimeout(r, 1000));
  }
  return ValidateQCodes(currentResults);
}

export function buildQueryForQCodeNames(qCodes: QCode<number>[]) {
  const val = `SELECT DISTINCT ?item ?itemLabel
          WHERE
          {
            VALUES ?item {${qCodes.map((code) => `wd:${code}`).join(" ")}}
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } 
          }`;

  return val;
}
