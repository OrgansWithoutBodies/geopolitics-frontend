import {
  EventID,
  Network,
  NetworkNodeTemplate,
  NodesComponentProps,
  Timeline,
} from "react-konva-components/src";
import { AdaptPlugin } from "./DashboardNodes";
import { INetworkNode, ITimelineNode } from "./DashboardNodes.types";

export function NetworkDashboardNode({
  inputs: {
    entities: { nodes, edges },
  },
  outputs: { selectedEntities },
  dashboardNodeProps: { stageSize },
}: AdaptPlugin<INetworkNode>): JSX.Element {
  console.log(selectedEntities);
  return (
    <Network
      nodes={nodes}
      stageSize={stageSize}
      edges={edges}
      NodeTemplate={({
        node,
      }: {
        node: NodesComponentProps["nodes"][number];
      }) => (
        <NetworkNodeTemplate
          onMouseLeave={function (): void {
            throw new Error("Function not implemented.");
          }}
          onSelectNode={function (): void {
            throw new Error("Function not implemented.");
          }}
          onMouseOver={function (): void {
            throw new Error("Function not implemented.");
          }}
          onNodeMove={function (): void {
            throw new Error("Function not implemented.");
          }}
          highlightedNode={null}
          node={node}
        />
      )}
    />
  );
}

// export function WorldMapDashboardNode({
//   inputs: {
//     entities: { map },
//     fills: { highlights },
//     onClick,
//   },
//   outputs: { selectedEntities },
//   dashboardNodeProps: { stageSize },
// }: AdaptPlugin<IMapNode<number>>): JSX.Element {
//   // TODO
//   console.log(selectedEntities);
//   return (
//     <WorldMap
//       // TODO select/onSelect
//       container={{
//         sizePx: stageSize,
//         center: [0, 0],
//       }}
//       contents={{
//         onClick,
//         // TODO
//         countries: map as any,
//         // countryToRegion: {},
//         countryToName: {},
//         // countryLines: undefined,
//         // countryHeartMap: undefined,
//         highlights,
//       }}
//     />
//   );
// }
export function TimelineDashboardNode({
  inputs: {
    entities: { events },
    timelineEnd: { timelineEnd },
    timelineStart: { timelineStart },
  },
  outputs: {
    selectedEntities: { selecteds },
  },
  options,
  dashboardNodeProps: { stageSize },
}: //  dash {stageSize},
AdaptPlugin<ITimelineNode<EventID>>): JSX.Element {
  return (
    <Timeline
      stageSize={stageSize}
      onHoveredEvent={function (): void {
        throw new Error("Function not implemented.", options);
      }}
      onSelectEvent={function (): void {
        throw new Error("Function not implemented.");
      }}
      // TODO
      events={events as any}
      latestEventEnd={timelineEnd}
      earliestEventStart={timelineStart}
      selectedEventIds={selecteds}
    />
  );
}
