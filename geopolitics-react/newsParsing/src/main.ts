import axios from "axios";
import fs from "fs";
import { parse } from "node-html-parser";
import Parser from "rss-parser";

// TODO
// https://spacy.io/universe/project/spacy-js
// maybe? parse things without direct wiki page links

const S_IN_MS = 1000;
async function sleep(lenMS: number) {
  await new Promise((r) => setTimeout(r, lenMS));
  console.log(`Waited ${lenMS}ms to be friendly`);
}

type URL = `http://${string}` | `https://${string}`;

type QCode = `Q${number}`;
type CustomFeed = {
  link: URL;
  feedUrl: URL;
  title: string;
  lastBuildDate: string;
};
type CustomEntry = {
  id: string;
  title: string;
  link: URL;
  pubDate: string;
  isoDate: string;
  updated: string;
  summary: string;
  author: { name: string };
};

async function parseFeed(
  parser: Parser<CustomFeed, CustomEntry>,
  feedUrl: URL
) {
  const feed = await parser.parseURL(feedUrl);
  const parsedFeed = {
    ...feed,
    items: feed.items.map((item) => ({
      ...item,
      parsedSummary: parse(item.summary),
    })),
  };
  return parsedFeed;
}

const getWikidataObjectForWikiPage = (
  articleNames: string[],
  page: "wikipedia" | "wikinews" = "wikipedia"
) =>
  // TODO maybe can do more than one here? says 'titles'
  `https://en.${page}.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${articleNames.join(
    "|"
  )}`;
// TODO no !
const getQCodesFromTitles = async (
  titles: (string | undefined)[],
  page: "wikipedia" | "wikinews" = "wikipedia"
): Promise<WDInfo[]> => {
  const pageUrl = getWikidataObjectForWikiPage(
    titles.filter((val) => val !== undefined) as string[],
    page
  );
  const res = await axios.get(pageUrl);

  if (-1 in res.data.query.pages) {
    delete res.data.query.pages[-1];
  }
  const resData = (
    Object.values(res.data.query.pages) as {
      pageid: number;
      ns: number;
      title: string;
      pageprops: { wikibase_item: QCode };
    }[]
  ).filter((val) => "pageprops" in val);

  console.log(
    "TEST123",
    resData.map(({ title, pageprops }) => ({ title, pageprops }))
  );

  return resData.map((data) => ({
    title: data.title,
    code: data.pageprops.wikibase_item,
  }));
};
function makeParserForFeed() {
  const parser: Parser<CustomFeed, CustomEntry> = new Parser({});

  return parser;
}
const feedsToGet = [
  "https://en.wikinews.org/w/index.php?title=Special:NewsFeed&feed=atom&count=200" as const,
];

type WDInfo = { code: QCode; title: string };

async function getData(feeds: URL[]): Promise<
  | null
  | (CustomFeed & {
      items: (CustomEntry & {
        qCodes: (WDInfo | null)[];
        articleQCode: WDInfo | null;
      })[];
    })[]
> {
  const parser = makeParserForFeed();

  const gottenFeeds = await Promise.all(
    feeds.map((feed) => {
      const parsedFeed = parseFeed(parser, feed);
      return parsedFeed;
    })
  );
  await sleep(S_IN_MS);
  const hrefsItems = gottenFeeds[0].items.map((item) =>
    item.parsedSummary.querySelectorAll("a")
  );
  const hrefLinks = hrefsItems.map((hrefs) => [
    ...new Set(
      hrefs.map((val) =>
        val.rawAttrs
          .split(" ")
          .find((str) => str.split("=")[0] === "href")
          ?.replace("href=", "")
          .replace('"', "")
          .replace('"', "")
      )
    ),
  ]);
  // .filter((link) => (link as any).href !== undefined)
  const wikipediaLinks = hrefLinks.map((href) =>
    href
      .filter((val) => val?.startsWith("https://en.wikipedia.org/wiki/"))
      .map((val) => val?.replace("https://en.wikipedia.org/wiki/", ""))
  );
  const wikinewsLinks = hrefLinks.map((href) =>
    href
      .filter((val) => val?.startsWith("/wiki/"))
      .map((val) => val?.replace("/wiki/", ""))
  );
  if (!wikipediaLinks) {
    return null;
  }
  const qCodesFromWikipedia: WDInfo[][] = await Promise.all(
    wikipediaLinks.map(async (titles, ii) => {
      await sleep(S_IN_MS * ii);
      return await getQCodesFromTitles(titles);
    })
  );

  const qCodesFromWikiNews: WDInfo[][] = await Promise.all(
    wikinewsLinks.map(async (titles, ii) => {
      await sleep(S_IN_MS * ii);
      return await getQCodesFromTitles(titles, "wikinews");
    })
  );

  await sleep(S_IN_MS);

  // TODO this is returning wrong
  const articleQCodes: WDInfo[] | null = await getQCodesFromTitles(
    gottenFeeds[0].items.map((item) => item.title),
    "wikinews"
  );
  // TODO get qcode from wikinews item itself, wikinews categories linked to, other wikinews articles linked to
  type WikiNewsString<TString extends string = string> = `wiki/${TString}`;
  type CategoryString = WikiNewsString<`Category:${string}`>;
  // TODO make work w more than one feed for qcode indexing
  // tho why would we need that
  const feedWithQCodes = gottenFeeds.map(({ items }, fIndex) => ({
    ...gottenFeeds[fIndex],
    items: items.map((item, iIndex) => ({
      ...item,
      articleQCode: articleQCodes ? articleQCodes[iIndex] : null,
      parsedSummary: undefined,
      qCodes: [...qCodesFromWikipedia[iIndex], ...qCodesFromWikiNews[iIndex]],
    })),
  }));
  // console.log(feedWithQCodes);
  return feedWithQCodes;
}
async function run() {
  const data = await getData(feedsToGet);
  if (data === null) {
    return;
  }
  console.log(data[0]["items"]);
  // var fs = require('fs');
  fs.writeFile(
    "out/wikiNewsDataLookup.json",
    JSON.stringify(data[0]),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
}
// run();
type Years =
  | 2002
  | 2003
  | 2004
  | 2005
  | 2006
  | 2007
  | 2008
  | 2009
  | 2010
  | 2011
  | 2012
  | 2013
  | 2014
  | 2015
  | 2016
  | 2017
  | 2018
  | 2019
  | 2020
  | 2021
  | 2022
  | 2023;

type Months =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";
type Days =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31;

type EventPage = {
  Title: string;
  Uri: string;
  ExternalUrl: string;
};

type EventSource = {
  Name: string;
  Url: string;
};

type CurrEventsDateStr<
  TYear extends Years,
  TMonth extends Months,
  TDay extends Days
> = `https://en.wikipedia.org/wiki/Portal:Current_events/${TYear}_${TMonth}_${TDay}`;
type Event = {
  Html: string;
  OriginalHtml: string;
  Text: string;
  OriginalText: string;
  Category: string;
  Topics: EventPage[];
  PrimaryTopic: EventPage;
  Sources: EventSource[];
  PrimarySource: EventSource;
  References: EventPage[];
  Date: Date;
  OriginalDate: string;
  Checksum: string;
  Page: string;
  Contributors: string;
};

type Date = {
  y: Years;
  m: Months;
  d: Days;
};

function parseWikipediaCurrentEvents({ y, m, d }: Date) {
  const dateStr = `https://en.wikipedia.org/wiki/Portal:Current_events/${y}_${m}_${d}`;
}
