import { Query } from "@datorama/akita";
import { combineLatest, map, Observable } from "rxjs";
import {
  periodIsSegmentGuard,
  HexStr,
  HistoricalEvent,
  LineSegment,
  RenderableEvent,
  SpaceConvertingFunction,
  TimelineSpace,
  TimeSpace,
  PeriodOrSingleton,
} from "../types";
import { DataState, DataStore, dataStore } from "./data.store";
const getRandomColor = (): HexStr => {
  const channelSize = 16;
  const charCode = new Array(6)
    .fill(0)
    .map(() => Math.round(Math.random() * channelSize).toString(16))
    .reduce((prev, curr) => prev + curr);

  return `#${charCode}`;
};

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
export class DataQuery extends Query<DataState> {
  public static sortEvents = (
    events: HistoricalEvent[],
    sortKey: keyof LineSegment
  ) => {
    return [...events].sort((eventA, eventB) => {
      return timeObjAAfterTimeObjB(eventA.eventTime, eventB.eventTime, "start")
        ? 1
        : -1;
    });
  };

  // TODO is timeline len supposed to be number of years?
  public static buildEventPositioner = (
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
  constructor(protected store: DataStore) {
    super(store);
  }

  private unfilteredEvents = this.select("events");

  public initialDateFilter = this.select("initialDateFilter");
  public finalDateFilter = this.select("finalDateFilter");

  public events = combineLatest([
    this.unfilteredEvents,
    this.initialDateFilter,
    this.finalDateFilter,
  ]).pipe(
    map(([events, initialDateFilter, finalDateFilter]) => {
      if (!(initialDateFilter !== null || finalDateFilter !== null)) {
        return events;
      }

      const eventsAboveInitial = !initialDateFilter
        ? events
        : events.filter((event) => {
            return timeObjAAfterTimeObjB(
              event.eventTime,
              initialDateFilter,
              "start"
            );
          });

      const eventsBelowFinal = !finalDateFilter
        ? eventsAboveInitial
        : eventsAboveInitial.filter((event) => {
            return timeObjAAfterTimeObjB(
              finalDateFilter,
              event.eventTime,
              "end"
            );
          });

      return eventsBelowFinal;
    })
  );

  public numberEventsAfterFilter = this.events.pipe(
    map((events) => events.length)
  );

  public eventsSortedByStartDate = this.events.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "start");
    })
  );

  public eventsSortedByEndDate = this.events.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "end");
    })
  );

  public unfilteredEventsSortedByStartDate = this.unfilteredEvents.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "start");
    })
  );

  public unfilteredEventsSortedByEndDate = this.unfilteredEvents.pipe(
    map((events) => {
      return DataQuery.sortEvents(events, "end");
    })
  );

  public earliestEventStart = this.eventsSortedByStartDate.pipe(
    map(([{ eventTime }]) => {
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.start : eventTime;
    })
  );

  public latestEventEnd = this.eventsSortedByEndDate.pipe(
    map((events) => {
      const { eventTime } = events[events.length - 1];
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.end : eventTime;
    })
  );

  public initialDateFilterWithFallback = combineLatest([
    this.initialDateFilter,
    this.earliestEventStart,
  ]).pipe(map(([date, fallback]) => (date ? date : fallback)));

  public finalDateFilterWithFallback = combineLatest([
    this.finalDateFilter,
    this.latestEventEnd,
  ]).pipe(map(([date, fallback]) => (date ? date : fallback)));

  public unfilteredEarliestEventStart =
    this.unfilteredEventsSortedByStartDate.pipe(
      map(([{ eventTime }]) => {
        const isSegment = periodIsSegmentGuard(eventTime);
        return isSegment ? eventTime.start : eventTime;
      })
    );

  public unfilteredLatestEventEnd = this.unfilteredEventsSortedByEndDate.pipe(
    map((events) => {
      const { eventTime } = events[events.length - 1];
      const isSegment = periodIsSegmentGuard(eventTime);
      return isSegment ? eventTime.end : eventTime;
    })
  );

  // derived observables
  public renderReadyEvents: Observable<RenderableEvent[]> = combineLatest([
    this.events,
    this.initialDateFilterWithFallback,
    this.finalDateFilterWithFallback,
  ]).pipe(
    map(([events, earliest, latest]) => {
      const positioner = DataQuery.buildEventPositioner(earliest, latest);
      return events.map((event) => {
        return {
          ...event,
          renderedProps: {
            color: getRandomColor(),
            position: positioner(event),
          },
        };
      });
    })
  );
}
export const dataQuery = new DataQuery(dataStore);
