# brohlik / shared-grocery cart

`web-ext run`

- make the url matcher more specific to the cart path?
- Need to inspect the extension in order to see the logs about:debugging#/runtime/this-firefox
- background scripts run on a separate, generated html page
  -Using webRequest.filterResponseData will replace the MutationObserver implementation for handling cart data and state
