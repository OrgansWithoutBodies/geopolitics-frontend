import { ImperativePanelHandle } from "react-resizable-panels";
import "./App.css";

import { useEffect, useRef, useState } from "react";
import { countryInfo } from "./countryData";
import { QuotedText } from "./links/QuotedText";
import {
  CountryCode,
  CountryInfoKey,
  CountryNameLookup,
  CountryRegionLookup,
  RegionColorMap,
} from "./mapTypes";
import { ObjV2 } from "./types";
import { buildQueryStringAndPost } from "./wd.requests";
function App() {
  // const ref = useRef<ImperativePanelGroupHandle>(null);

  const resetLayout = () => {
    const panelGroup = ref.current;
    if (panelGroup) {
      // Reset each Panel to 50% of the group's width
      panelGroup.setLayout([50, 50]);
    }
  };

  const mapVals = {
    country: {
      sourceKey: "item",
      pCode: "P17",
      valueKey: "?country",
      joinChar: ".",
      optional: false,
    },
    coords: {
      sourceKey: "country",
      pCode: "P625",
      valueKey: "?coords",
      joinChar: ".",
      optional: false,
    },
    ideology: {
      sourceKey: "item",
      pCode: "P1142",
      valueKey: "?ideology",
      joinChar: ".",
      optional: true,
    },
    start: {
      sourceKey: "item",
      pCode: "P571",
      valueKey: "?start",
      joinChar: ".",
      optional: true,
    },
    end: {
      sourceKey: "item",
      pCode: "P576",
      valueKey: "?end",
      joinChar: ".",
      optional: true,
    },
  };
  const timelinePanelRef = useRef<ImperativePanelHandle>(null);
  const [paneSize, setPaneSize] = useState<number | null>(null);
  void buildQueryStringAndPost(
    "",
    ["country", "coords", "ideology", "start", "end"],
    "wd:Q7278",
    mapVals
  );
  useEffect(() => {
    console.log("TEST123-effect");
    if (timelinePanelRef.current) {
      setPaneSize(timelinePanelRef.current.getSize());
    }
  }, [timelinePanelRef.current?.getSize]);
  const canvasSize: ObjV2 = { x: 1000, y: 300 };
  const regionColorMap: RegionColorMap = {
    Africa: "green",
    Americas: "yellow",
    Antarctica: "white",
    Asia: "blue",
    Europe: "cyan",
    Oceania: "red",
  };
  const [year, setYear] = useState(2000);

  const mapCountryData = (key: CountryInfoKey, value: CountryInfoKey) =>
    Object.fromEntries(
      countryInfo.map((country) => [country[key], country[value]])
    );
  const countryToRegion = mapCountryData(
    "alpha-3",
    "region"
  ) as CountryRegionLookup<CountryCode>;
  const countryToName = mapCountryData(
    "alpha-3",
    "name"
  ) as CountryNameLookup<CountryCode>;
  return (
    <>
      <div>
        <div onClick={() => setYear(year + 1)}>+</div>
        <div onClick={() => setYear(year - 1)}>-</div>
      </div>
      <QuotedText />
      {/* <WorldMap
        container={{
          sizePx: { x: 1024, y: 780 },
          center: [0, 0],
        }}
        contents={{
          countries: Object.entries(CountryFiles).map(([key, geometry]) => ({
            key,
            geometry,
          })),
          countryToRegion,
          countryToName,
          regionColorMap,
          countryHeartMap: Capitals,
          bilateralRelations,
        }}
      /> */}
    </>
    // <div style={{ width: canvasSize.x, height: canvasSize.y }}>
    //   <div className={styles.Container}>
    //     <PanelGroup direction="vertical">
    //       <Panel
    //         defaultSize={100}
    //         className={styles.Panel}
    //         ref={timelinePanelRef}
    //       >
    //         <div className={styles.PanelContent}>
    //           <Timeline stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* TEST */}
    //       </Panel>
    //       <ResizeHandle />
    //       <Panel className={styles.Panel}>
    //         <div className={styles.PanelContent}>
    //           <Network stageSize={{ x: canvasSize.x, y: paneSize || 0 }} />
    //         </div>
    //         {/* <Timeline /> */}
    //         {/* <AddNewEvent /> */}
    //       </Panel>
    //     </PanelGroup>
    //   </div>
    // </div>
  );
}

export default App;
const PanelStyles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: " center",
    justifyContent: " center",
    overflow: "hidden",
    borderRadius: " 0.5rem",
  },
};
