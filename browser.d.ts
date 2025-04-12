// browser.d.ts

/// <reference lib="webworker" />
/// <reference lib="scripthost" />

declare const browser: {
  webRequest: {
    filterResponseData: (requestId: string) => any;
    onBeforeRequest: {
      addListener: (
        listener: (details: any) => void,
        filter: any,
        opt_extraInfoSpec?: string[]
      ) => void;
    };
  };
  runtime: {
    onMessage: {
      addListener: (
        listener: (message: any, sender: any, sendResponse: any) => void
      ) => void;
    };
  };
  tabs: {
    onUpdated: {
      addListener: (
        listener: (tabId: number, changeInfo: any, tab: any) => void
      ) => void;
    };
  };
};
