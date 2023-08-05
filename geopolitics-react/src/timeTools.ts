import { TimeSpace } from "type-library";

export const MS_IN_S = 1000;
export const S_IN_MIN = 60;
export const MIN_IN_HOUR = 60;
export const HOUR_IN_DAY = 24;
export const DAY_IN_YEAR = 365;

export const MS_IN_YEAR =
  DAY_IN_YEAR * HOUR_IN_DAY * MIN_IN_HOUR * S_IN_MIN * MS_IN_S;
export function offsetDate(eventTime: TimeSpace): TimeSpace {
  return Math.round(eventTime * (1 / MS_IN_YEAR) + 1970) as TimeSpace;
}
export function unoffsetDate(eventTime: TimeSpace): TimeSpace {
  return Math.round((eventTime - 1970) / (1 / MS_IN_YEAR)) as TimeSpace;
}
