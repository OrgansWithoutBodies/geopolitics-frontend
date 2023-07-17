import { createContext, useContext } from "react";
import { KonvaSpace } from "type-library";
import { SpaceConvertingFunction, TimelineSpace } from "./types";

type TimelineVars = {
  smallDivsPerBigDiv: number;
  smallDivHeight: number;
  divisionSpace: number;
  divisionLen: number;
  timelineLeftPadding: number;
  numDivisions: number;
  overallTimelineLen: number;
  convertToKonvaCoord: SpaceConvertingFunction<TimelineSpace, KonvaSpace>;
};

export const BaseTimelineVariables = {
  smallDivsPerBigDiv: 4,
  smallDivHeight: 10,
  divisionSpace: 150,
  divisionLen: 50,
  timelineLeftPadding: 50,
  numDivisions: 5,
};
export const TimelineVariables: TimelineVars = {
  ...BaseTimelineVariables,
  overallTimelineLen:
    BaseTimelineVariables.numDivisions * BaseTimelineVariables.divisionSpace,
  // TODO y coord?
  convertToKonvaCoord: (val) =>
    (val *
      BaseTimelineVariables.numDivisions *
      BaseTimelineVariables.divisionSpace) as KonvaSpace,
};
export function setupTimelineContext(context: TimelineVars) {
  return createContext<TimelineVars>(context);
}
export const TimelineContext = setupTimelineContext(TimelineVariables);

export function useTimelineContext() {
  return useContext(TimelineContext);
}
