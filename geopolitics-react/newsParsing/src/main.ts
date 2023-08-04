import axios from "axios";
import fs from "fs";
import { HTMLElement, Node, parse as htmlParser } from "node-html-parser";
import Parser from "rss-parser";
import { sleep } from "./sleep";

// TODO
// https://spacy.io/universe/project/spacy-js
// maybe? parse things without direct wiki page links

const S_IN_MS = 1000;
function getHrefContent(val: HTMLElement): string | undefined {
  return val.rawAttrs
    .split(" ")
    .find((str) => str.split("=")[0] === "href")
    ?.replace("href=", "")
    .replace('"', "")
    .replace('"', "");
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
      parsedSummary: htmlParser(item.summary),
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
const getQCodesFromTitles = async (
  titles: (string | undefined)[],
  page: "wikipedia" | "wikinews" = "wikipedia"
): Promise<WDInfo[]> => {
  const chunkSize = 50;
  const numChunks = Math.ceil(titles.length / chunkSize);
  const datas = (
    await Promise.all(
      [...Array.from({ length: numChunks }).keys()].map(async (ii) => {
        sleep(S_IN_MS * ii);
        const pageUrl = getWikidataObjectForWikiPage(
          titles
            .filter((val) => val !== undefined)
            .slice(ii * chunkSize, (ii + 1) * chunkSize) as string[],
          page
        );
        const res = await axios.get(pageUrl);
        return parseQCodes(res, pageUrl);
      })
    )
  ).flat();
  return datas;
};
function parseQCodes(res: { data: any; status: number }, pageUrl: string) {
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

  return resData.map((data) => ({
    title: data.title,
    code: data.pageprops.wikibase_item,
  }));
}

function makeParserForFeed() {
  const parser: Parser<CustomFeed, CustomEntry> = new Parser({});

  return parser;
}
const feedsToGet = [
  "https://en.wikinews.org/w/index.php?title=Special:NewsFeed&feed=atom" as const,
];

// TODO https://github.com/gipplab/news-story-identification
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
    ...new Set(hrefs.map((val) => getHrefContent(val))),
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

const Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
type Months = (typeof Months)[number];
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
  Date: DateObj;
  OriginalDate: string;
  Checksum: string;
  Page: string;
  Contributors: string;
};

type DateObj = {
  y: Years;
  m: Months;
  d: Days;
};

async function parseWikipediaCurrentEvents({ y, m, d }: DateObj) {
  const urlStr = `https://en.wikipedia.org/wiki/Portal:Current_events/${y}_${m}_${d}`;
  const response = await axios.get(urlStr);
  if (response.status !== 200) {
    return;
  }
  const event = htmlParser(response.data);
  const eventBody = event
    .querySelector(".vevent")
    ?.querySelector(".description");
  // eventBody.chil
  const children = eventBody?.childNodes.filter((node) => node.text !== "\n");
  if (!children) {
    return;
  }
  const NodeIsHTMLElementGuard = (node: Node): node is HTMLElement => {
    return "classList" in node;
  };

  const parseEntry = (
    node: Node
  ): {
    externalLink: { text: string | undefined; link: string | undefined } | null;
    internalLinks: string[];
    text: string;
  } => {
    const externalLink = NodeIsHTMLElementGuard(node)
      ? {
          text: node.querySelector(".external")?.text as string | undefined,
          link: node.querySelector(".external")
            ? getHrefContent(node.querySelector(".external")!)
            : undefined,
        }
      : null;
    const links = NodeIsHTMLElementGuard(node)
      ? node
          .querySelectorAll("a")
          .map((link) => getHrefContent(link))
          .filter((v) => v !== undefined)
          .filter((v) => v?.startsWith("/"))
      : null;
    return {
      externalLink: externalLink,
      internalLinks: (links as string[]) || [],
      text: node.text,
    };
  };
  // node.childNodes is a list of lis - each li is either an event or (potentially multiple) entries into a topic with
  const parseDetails = (node: Node) => {
    const lis = node.childNodes.filter((v) => v.text !== "\n");
    return lis.map((li) => {
      if (NodeIsHTMLElementGuard(li)) {
        const eventDetailsList = li.querySelector("ul");
        // not part of broader topic
        if (eventDetailsList === null) {
          // TODO parse links here
          return parseEntry(li);
        }
        const broaderTopicNodes = li.childNodes.slice(0, -2);
        const broaderTopicString = broaderTopicNodes
          .map((broaderTopicNode) => broaderTopicNode.text)
          .join("");
        const broaderTopicLinks = broaderTopicNodes
          .filter((v) => NodeIsHTMLElementGuard(v) && v.rawTagName === "a")
          .map((v) => getHrefContent(v as HTMLElement));

        // now get details
        return {
          broaderTopicString,
          broaderTopicLinks,
          entries: eventDetailsList.childNodes.map((entry) =>
            parseEntry(entry)
          ),
        };
      }
      // this seems to be where the missing stories come from
      return null;
    });
    // if(events[events.length-1]==='ul'){

    // }
  };
  const data = {
    date: { y, m, d },
    events: [...Array.from({ length: children.length / 2 }).keys()].map(
      (ii) => {
        return {
          category: children[2 * ii].text,
          stories: parseDetails(children[2 * ii + 1]),
        };
      }
    ),
  };

  const internalLinks = data.events
    .map((event) =>
      event.stories
        .map((v) => (v && "internalLinks" in v ? v.internalLinks : null))
        .filter((v) => v !== null)
        .flat()
    )
    .flat();
  const allInternalLinks = [
    ...internalLinks,
    ...data.events
      .map((event) =>
        event.stories
          .map((v) =>
            v && "entries" in v
              ? v.entries.map((vv) => vv.internalLinks.flat()).flat()
              : null
          )
          .filter((v) => v !== null)
          .flat()
      )
      .flat(),
  ] as string[];
  // .filter((v) => v !== null);
  const qCodes = await getQCodesFromTitles(
    allInternalLinks.map((v) => v.replace("/wiki/", "").split("#")[0])
  );
  // console.log(qCodes);
  if (!fs.existsSync(`out/currentEvents/${y}/${m}`)) {
    fs.mkdirSync(`out/currentEvents/${y}/${m}`, { recursive: true });
  }
  fs.writeFile(
    `out/currentEvents/${y}/${m}/data-${d}.json`,
    JSON.stringify({ ...data, qCodes }),
    { flag: "wx" },
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
  // console.log();
  // we expect children here to be loosely coupled p/ul pairs
  // topics = append(topics, EventPage{
  //   Title:       primaryTopicTitle,
  //   Uri:         primaryTopicUri,
  //   ExternalUrl: "https://en.wikipedia.org" + primaryTopicUri,
  // })
}

const parseWikipediaCurrentEventsBetweenDates = async (
  { y: ys, m: ms, d: ds }: DateObj,
  { y: ye, m: me, d: de }: DateObj
) => {
  const startDate = new Date(`${ds} ${ms} ${ys}`);
  const endDate = new Date(`${de} ${me} ${ye}`);
  const currentDate = startDate;
  while (currentDate.getTime() < endDate.getTime()) {
    // console.log(currentDate, currentDate.getDate(), endDate.getDate());
    parseWikipediaCurrentEvents({
      y: currentDate.getFullYear() as Years,
      m: Months[currentDate.getMonth()] as Months,
      d: currentDate.getDate() as Days,
    });
    await sleep(S_IN_MS);
    // var tomorrow = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

parseWikipediaCurrentEventsBetweenDates(
  { y: 2010, m: "January", d: 1 },
  { y: 2020, m: "January", d: 1 }
  // { y: 2023, m: "January", d: 1 }
  // { y: 2023, m: "June", d: 25 }
);
function compareDomains(domainA: string, domainB: string) {
  const sectionsA = domainA.replace("www.", "").split(".");
  const sectionsB = domainB.replace("www.", "").split(".");

  const minNumSections = Math.min(sectionsA.length, sectionsB.length);
  let currentSection = 0;
  while (currentSection < minNumSections) {
    const thisSectionMatches =
      sectionsA[currentSection] === sectionsB[currentSection];
    if (!thisSectionMatches) {
      return false;
    }
    currentSection += 1;
  }
  return true;
}
