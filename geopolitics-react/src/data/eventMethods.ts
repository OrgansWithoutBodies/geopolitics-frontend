import {
  periodIsSegmentGuard,
  type EventID,
  type HistoricalEvent,
  type LineSegment,
  type PeriodOrSingleton,
  type SpaceConvertingFunction,
} from "react-konva-components/src/types";
import type { TimeSpace, TimelineSpace } from "type-library";
import type { CountryID, CountryType } from "./data.store";
import { numericalQCode } from "./numericalQCode";

const timeObjAAfterTimeObjB = (
  timeA: PeriodOrSingleton<TimeSpace>,
  timeB: PeriodOrSingleton<TimeSpace>,

  key: keyof LineSegment
): boolean => {
  const aIsSegment = periodIsSegmentGuard(timeA);
  const bIsSegment = periodIsSegmentGuard(timeB);

  if (aIsSegment && bIsSegment) {
    return timeA[key] >= timeB[key];
  }
  if (aIsSegment && !bIsSegment) {
    return timeA[key] >= timeB;
  }
  if (!aIsSegment && bIsSegment) {
    return timeA >= timeB[key];
  }
  if (!aIsSegment && !bIsSegment) {
    return timeA >= timeB;
  }
  return false;
};

export function applyFiltersToEvents(
  initialDateFilter: TimeSpace | null,
  events: HistoricalEvent[],
  finalDateFilter: TimeSpace | null
) {
  if (!(initialDateFilter !== null || finalDateFilter !== null)) {
    return events;
  }

  const filteredEvents = events.filter((event) => {
    const afterInitial =
      initialDateFilter === null
        ? true
        : timeObjAAfterTimeObjB(event.eventTime, initialDateFilter, "start");
    const beforeFinal =
      finalDateFilter === null
        ? true
        : timeObjAAfterTimeObjB(finalDateFilter, event.eventTime, "end");
    return afterInitial && beforeFinal;
  });

  return filteredEvents;
}

export const sortEvents = (
  events: HistoricalEvent[],
  sortKey: keyof LineSegment
) => {
  // console.log("TODO", sortKey);
  return [...events].sort((eventA, eventB) => {
    return timeObjAAfterTimeObjB(eventA.eventTime, eventB.eventTime, sortKey)
      ? 1
      : -1;
  });
};

// TODO is timeline len supposed to be number of years?
export const buildEventPositioner = (
  earliestDate: TimeSpace,
  latestDate: TimeSpace
) => {
  const timelinePositionForEvent: SpaceConvertingFunction<
    TimeSpace,
    TimelineSpace
  > = (val) => {
    const timelineLen = latestDate - earliestDate;
    return ((val - earliestDate) / timelineLen) as TimelineSpace;
  };

  const eventPositioner = ({ eventTime }: HistoricalEvent): TimelineSpace => {
    const isSegment = periodIsSegmentGuard(eventTime);
    if (isSegment) {
      // for time period events just position tooltip in the middle
      return ((timelinePositionForEvent(eventTime.end) +
        timelinePositionForEvent(eventTime.start)) /
        2) as TimelineSpace;
    }

    return timelinePositionForEvent(eventTime);
  };
  return eventPositioner;
};
export function positionNode(
  country: CountryType,
  start: TimeSpace,
  end: TimeSpace,
  qCodes: Record<`Q${CountryID}`, string>,
  selectedCountry: CountryID | null,
  nodeColorLookup: Record<`${CountryID}`, `#${string}`>
) {
  const startDate = country.stateStart.value;
  const eventTime = new Date(startDate).getTime() as TimeSpace;
  const positioner = buildEventPositioner(start, end);
  const genericProps = {
    id: numericalQCode(country) as EventID,
    eventName: `Beginning of ${qCodes[country.item.value]}`,
    eventInfo: "",
    eventTime,
  };
  return {
    ...genericProps,
    renderedProps: {
      // TODO no as any, same as overloading country & event id as same
      color:
        (selectedCountry as any) === (genericProps.id as any)
          ? "#FFFF00"
          : nodeColorLookup[`${genericProps.id as any}`] || "#AAAAAA",
      position: positioner(genericProps),
    },
  };
}
