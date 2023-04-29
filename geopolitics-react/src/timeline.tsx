import { KonvaEventObject } from "konva/lib/Node";
import { useState } from "react";
import {
  Arrow,
  Circle,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from "react-konva";
import { DataQuery } from "./data/data.query";
import { dataService } from "./data/data.service";
import {
  TimelineContext,
  TimelineVariables,
  useTimelineContext,
} from "./TimelineContext";
import {
  EventID,
  periodIsSegmentGuard,
  HistoricalEvent,
  RenderableEvent,
  TimelineSpace,
  TimeSpace,
} from "./types";
import { useData } from "./useAkita";

// TODO flexible enough for non-hardcoded values (useContext?)

const orderedNumbers = (length: number): number[] => [
  ...Array.from({ length }).keys(),
];

export function TimelineBackground({
  lastDate,
  firstDate,
}: {
  lastDate: number;
  firstDate: number;
}): JSX.Element {
  // TODO put the dates these markers correspond to? toggleable?
  const {
    numDivisions,
    smallDivsPerBigDiv,
    divisionSpace,
    divisionLen,
    smallDivHeight,
    convertToKonvaCoord,
  } = useTimelineContext();

  const endpointSize = 30;
  const bigLines = orderedNumbers(numDivisions);
  const smallLines = orderedNumbers(numDivisions * smallDivsPerBigDiv);

  return (
    <Group>
      {bigLines.map((_, ii) => {
        return (
          <Line
            x={0}
            y={0}
            stroke={"black"}
            points={[ii * divisionSpace, 0, ii * divisionSpace, divisionLen]}
          />
        );
      })}
      {smallLines.map((_, jj) => {
        return (
          <Line
            x={0}
            y={0}
            stroke={"black"}
            points={[
              ((jj + 1) * divisionSpace) / smallDivsPerBigDiv,
              divisionLen / 2 - smallDivHeight / 2,

              ((jj + 1) * divisionSpace) / smallDivsPerBigDiv,
              divisionLen / 2 + smallDivHeight / 2,
            ]}
          />
        );
      })}
      <Arrow
        x={0}
        y={0}
        stroke={"black"}
        points={[
          0,
          divisionLen / 2,
          convertToKonvaCoord(1 as TimelineSpace),
          divisionLen / 2,
        ]}
      />
      <Group y={divisionLen}>
        <Text
          fontSize={20}
          padding={10}
          fontFamily="Calibri"
          fontVariant="bold"
          textFill="white"
          fill="black"
          text={firstDate.toString()}
          x={0 - endpointSize}
        />
        <Text
          fontSize={20}
          padding={10}
          fontFamily="Calibri"
          textFill="white"
          fill="black"
          fontVariant="bold"
          text={lastDate.toString()}
          x={convertToKonvaCoord(1 as TimelineSpace) - endpointSize}
        />
      </Group>
    </Group>
  );
}

export function TimelineEvents({
  events,
  onMouseOver,
  onMouseLeave,
}: // onMouseMove,
{
  events: RenderableEvent[];
  onMouseOver: (id: EventID, event: KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (id: EventID, event: KonvaEventObject<MouseEvent>) => void;
  // onMouseMove: (id: EventID, event: KonvaEventObject<MouseEvent>) => void;
}): JSX.Element {
  const { convertToKonvaCoord, divisionLen } = useTimelineContext();
  return (
    <Group>
      {events.map((event) => {
        return (
          <Circle
            onMouseOver={(mouseEvent) => onMouseOver(event.id, mouseEvent)}
            onMouseLeave={(mouseEvent) => onMouseLeave(event.id, mouseEvent)}
            // onMouseMove={(mouseEvent) => onMouseMove(event.id, mouseEvent)}
            x={convertToKonvaCoord(event.renderedProps.position)}
            y={divisionLen / 2}
            radius={10}
            fill={event.renderedProps.color}
            stroke="black"
            strokeWidth={2}
          />
        );
      })}
    </Group>
  );
}
type Tooltip = {
  title: string;
  desc: string;
  pos: TimelineSpace;
  dates: string;
};

export function TimelineTooltip({
  tooltip: tooltip,
}: {
  tooltip: Tooltip | null;
}): JSX.Element {
  const titlePosY = 0;
  const tooltipHeight = 100;
  const diamondSize = 10;
  const diamondRadius = Math.sqrt(2 * diamondSize ** 2);

  const { convertToKonvaCoord } = useTimelineContext();
  return (
    <>
      {tooltip !== null && (
        <Group x={convertToKonvaCoord(tooltip.pos)} y={100 / 2}>
          <Rect
            width={10}
            height={10}
            y={(-1 * diamondRadius) / 2}
            rotation={45}
            cornerRadius={2}
            fill="gray"
          />
          <Group x={-1 * diamondRadius}>
            <Rect
              width={100}
              height={tooltipHeight}
              cornerRadius={5}
              fill="gray"
            />
            <Text
              text={tooltip.title}
              y={titlePosY}
              fontSize={20}
              fontVariant="bold"
              padding={10}
              fontFamily="Calibri"
              textFill="white"
              fill="black"
              alpha={0.75}
            />
            <Text
              text={tooltip.desc}
              y={titlePosY + 20}
              fontSize={10}
              padding={10}
              fontFamily="Calibri"
              textFill="white"
              fill="black"
              alpha={0.75}
            />
            <Text
              text={tooltip.dates}
              y={titlePosY + 40}
              fontSize={10}
              padding={10}
              fontFamily="Calibri"
              textFill="white"
              fill="black"
              alpha={0.75}
            />
          </Group>
        </Group>
      )}
    </>
  );
}

const formatDates = ({ eventTime }: HistoricalEvent): string => {
  const isSegment = periodIsSegmentGuard(eventTime);
  if (isSegment) {
    return `${eventTime.start} - ${eventTime.end}`;
  }
  return `${eventTime}`;
};

// function timelineContextProvider = Contextprop
export function Timeline(): JSX.Element {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [{ renderReadyEvents: events, earliestEventStart, latestEventEnd }] =
    useData(["renderReadyEvents", "earliestEventStart", "latestEventEnd"]);

  return (
    <TimelineContext.Provider value={TimelineVariables}>
      <FilterEvents />
      <Stage width={500 * 2} height={300} style={{ backgroundColor: "white" }}>
        <Layer x={TimelineVariables.timelineLeftPadding}>
          <TimelineBackground
            lastDate={latestEventEnd || -1}
            firstDate={earliestEventStart || -1}
          />
          {events && (
            <TimelineEvents
              events={events}
              onMouseOver={function (
                id: EventID,
                event: KonvaEventObject<MouseEvent>
              ): void {
                const hitEvent = events.find(
                  ({ id: sourceId }) => sourceId === id
                );
                if (hitEvent) {
                  setTooltip({
                    pos: hitEvent.renderedProps.position,
                    dates: formatDates(hitEvent),
                    desc: hitEvent.eventInfo,
                    title: hitEvent.eventName,
                  });
                }
              }}
              onMouseLeave={function (): void {
                setTooltip(null);
              }}
              // onMouseMove={function (
              //   id: EventID,
              //   event: KonvaEventObject<MouseEvent>
              // ): void {
              //   throw new Error("Function not implemented.");
              // }}
            />
          )}
          <TimelineTooltip tooltip={tooltip} />
        </Layer>
      </Stage>
    </TimelineContext.Provider>
  );
}

export function FilterEvents(): JSX.Element {
  const [
    {
      initialDateFilter,
      finalDateFilter,
      unfilteredEarliestEventStart: earliestEventStart,
      unfilteredLatestEventEnd: latestEventEnd,
      numberEventsAfterFilter,
    },
  ] = useData([
    "initialDateFilter",
    "finalDateFilter",
    "unfilteredEarliestEventStart",
    "unfilteredLatestEventEnd",
    "numberEventsAfterFilter",
  ]);
  console.log("TEST123", numberEventsAfterFilter);
  return (
    <>
      <div>
        <div>Start Filter</div>
        <input
          type="number"
          min={earliestEventStart}
          max={latestEventEnd}
          value={
            initialDateFilter !== null ? initialDateFilter : earliestEventStart
          }
          onChange={(event) =>
            dataService.setInitialDateFilter(
              Number.parseInt(event.target.value) as TimeSpace
            )
          }
        />
      </div>
      <div>
        <div>End Filter</div>
        <input
          type="number"
          min={earliestEventStart}
          max={latestEventEnd}
          value={finalDateFilter !== null ? finalDateFilter : latestEventEnd}
          onChange={(event) =>
            dataService.setFinalDateFilter(
              Number.parseInt(event.target.value) as TimeSpace
            )
          }
        />
      </div>
    </>
  );
}
