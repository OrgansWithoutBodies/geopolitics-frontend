import { HistoricalEvent } from "react-konva-components/src";
import type { ArrV3, HexString } from "type-library/src";

export type RangeBrandTag<TMin extends number, TMax extends number> = {
  __min: TMin;
  __max: TMax;
};
export type NumberInRange<TMin extends number, TMax extends number> = number &
  RangeBrandTag<TMin, TMax>;
type Channel = "R" | "G" | "B" | "A";

export type HexChannelNumber<TChannel extends Channel = Channel> =
  NumberInRange<0, 255> & { __channel: TChannel };

export type HexTripleNumber = ArrV3<HexChannelNumber>;
// TODO types from openapi
type BrandedType<T, Brand extends string = string> = T & {
  __brand: Brand;
};

export type LineSegment<TNum extends number = number> = {
  start: TNum;
  end: TNum;
};
export type TimePeriod = LineSegment<TimeSpace>;
export type PeriodOrSingleton<TNum extends number> = LineSegment<TNum> | TNum;
export type BrandedNumber<Brand extends string> = BrandedType<number, Brand>;
export type BrandedString<Brand extends string> = BrandedType<string, Brand>;
export type EventID = BrandedNumber<"Event">;
export type AgentID = BrandedNumber<"Agent">;
export type ConversionTag<TFrom extends number, TTo extends number> = {
  __from: TFrom;
  __to: TTo;
};
export type SpaceConvertingFunction<
  TFrom extends number,
  TTo extends number
> = (vFrom: TFrom) => TTo;

export type TimeSpace = BrandedNumber<"time">;
// TimelineSpace is a number between 0 & 1, representing the % of the timeline something is placed on
export type TimelineSpace = BrandedNumber<"timeline"> & RangeBrandTag<0, 1>;

export type RenderableEvent = HistoricalEvent & {
  renderedProps: {
    position: TimelineSpace;
    color: HexString;
  };
};
