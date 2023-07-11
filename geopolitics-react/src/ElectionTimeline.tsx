import elections from "../elections.json";
import { Timeline } from "./Timeline";
export function ElectionTimeline(): JSX.Element {
  const test = elections;
  return (
    <Timeline
      stageSize={{
        x: 500,
        y: 500,
      }}
      events={[]}
    ></Timeline>
  );
}
