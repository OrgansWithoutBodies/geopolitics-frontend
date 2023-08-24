import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

declare global {
  interface ObjectConstructor {
    keys<TKeys extends string | number>(
      o: Record<TKeys, unknown>
    ): `${TKeys}`[];
    values<TValues>(o: Record<keyof unknown, TValues>): TValues[];
  }
  interface NumberConstructor {
    parseInt<TNum extends number = number>(
      o: `${TNum}` | string,
      radix?: number | undefined
    ): TNum;
  }
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// const test=Number.parseInt(`${3 as number&{__test:true}}` )
