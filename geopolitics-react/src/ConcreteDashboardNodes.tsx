import {
  EventID,
  Network,
  Timeline,
  WorldMap,
} from "react-konva-components/src";
import { AdaptPlugin } from "./DashboardNodes";
import { IMapNode, INetworkNode, ITimelineNode } from "./DashboardNodes.types";

export function NetworkDashboardNode({
  inputs: {
    entities: { nodes, edges },
  },
  outputs: { selectedEntities },
  stageSize,
}: AdaptPlugin<INetworkNode<string>>): JSX.Element {
  return <Network nodes={nodes} stageSize={stageSize} edges={edges} />;
}
export function WorldMapDashboardNode({
  inputs: { entities, fills },
  outputs: { selectedEntities },
  stageSize,
}: AdaptPlugin<IMapNode<string>>): JSX.Element {
  return (
    <WorldMap
      // TODO select/onSelect
      container={{
        sizePx: stageSize,
        center: [],
      }}
      contents={{
        countries: entities,
        countryToRegion: undefined,
        countryToName: undefined,
        countryLines: undefined,
        countryHeartMap: undefined,
        highlights: fills,
      }}
    />
  );
}
export function TimelineDashboardNode({
  inputs: { entities },
  outputs: { selectedEntities },
  options: { timelineStart, timelineEnd },
  stageSize,
}: AdaptPlugin<ITimelineNode<number>>): JSX.Element {
  return (
    <Timeline
      stageSize={stageSize}
      onHoveredEvent={function (id: EventID): void {
        throw new Error("Function not implemented.");
      }}
      onSelectEvent={function (id: EventID): void {
        throw new Error("Function not implemented.");
      }}
      events={entities}
      latestEventEnd={timelineEnd}
      earliestEventStart={timelineStart}
      selectedEventId={null}
    />
  );
}
