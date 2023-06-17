type Topic = { name: string; details: string };
type URLString = string;
type QuoteSpan = { start: number; end: number };
type QuoteReplacement = { sourceSpan: QuoteSpan; replaceString: string };
type QuoteSection = {
  sectionSpan: QuoteSpan;
  replacements: QuoteReplacement[];
};
export type Quotation = {
  source: URLString;
  sourceText: string;
  sections: QuoteSection[];
};
type Evidence = {
  explanation: string;
  link: URLString;
  quotes: Quotation[];
};
type Claim = {
  topic: Topic;
  claim: string;
  source: Evidence[];
};
