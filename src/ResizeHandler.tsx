import * as React from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import styles from "./styles.module.css";

export function ResizeHandle() {
  return (
    <PanelResizeHandle
      className={[styles.ResizeHandleOuter].join(" ")}
      //   id={id}
    >
      <div className={styles.ResizeHandleInner}>
        <svg className={styles.Icon} viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z"
          />
        </svg>
      </div>
    </PanelResizeHandle>
  );
}

const PanelStyles: Record<string, React.CSSProperties> = {
  ResizeHandleInner: {
    position: "absolute",
    top: "0.25em",
    bottom: "0.25em",
    left: "0.25em",
    right: "0.25em",
    borderRadius: "0.25em",
    backgroundColor: "var(--background-color)",
    transition: "background-color 0.2s linear",
  },

  // .ResizeHandleOuter {
  //     flex: 0 0 1.5em;
  //     position: relative;
  //     outline: none;

  //     --background-color: transparent;
  //   }
  //   .ResizeHandleOuter[data-resize-handle-active] {
  //     --background-color: var(--color-solid-resize-bar-handle);
  //   }
  ResizeHandleOuter: {
    position: "absolute",
    top: "0.25em",
    bottom: "0.25em",
    left: "0.25em",
    right: "0.25em",
    borderRadius: "0.25em",
    backgroundColor: "var(--background-color)",
    transition: "background-color 0.2s linear",
  },
};
