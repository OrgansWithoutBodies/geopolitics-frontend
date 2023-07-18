import { useState } from "react";
import { HistoricalEvent } from "./types";

export function AddNewEvent() {
  const [newEvent, setNewEvent] = useState<HistoricalEvent | null>(null);
  return (
    <>
      <div>
        <div>
          <div>Event Name</div>
          <input />
        </div>
        <div>
          <div>Description</div>
          <input />
        </div>
        <div>
          <div>Start Date</div>
          <input />
        </div>
        <div>
          <div>End Date</div>
          <input />
        </div>
      </div>
      <button>Submit new event</button>
    </>
  );
}
