// browser.d.ts

/// <reference lib="webworker" />
/// <reference lib="scripthost" />

declare const browser: {
  runtime: {
    onMessage: {
      addListener: (
        listener: (message: any, sender: any, sendResponse: any) => void
      ) => void;
    };
    sendMessage: ({ action: string, productId: string, user: string }) => void;
  };
  scripting: {
    insertCSS: (details: {
      target: { allFrames: boolean };
      files: string[];
    }) => Promise<void>;
  };
  tabs: {
    onUpdated: {
      addListener: (
        listener: (tabId: number, changeInfo: any, tab: any) => void
      ) => void;
    };
  };
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
};
