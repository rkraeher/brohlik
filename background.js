const shoppingCart = {};

// needs to receive buttonIds and receive user updates from content.js
// OR, we generate a buttonId here for every cart item
// and use data-product-id to match the item with dom element and assign the buttonId
// (do we need a button id if we already have productId?)
function addToShoppingCart(item) {
  shoppingCart[item.productId] = {
    user: 'JT', // first user or some default
    price: item.price,
    quantity: item.quantity,
  };
}

// function updateShoppingCart(id, data) {
//   shoppingCart[id] = { ...shoppingCart[id], ...data };
//   console.log('cart', 'update', shoppingCart);
// }

function listener(details) {
  console.log('Intercepted request:', details.url);

  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder('utf-8');
  let responseText = '';

  filter.ondata = (event) => {
    let chunk = decoder.decode(event.data, { stream: true });
    responseText += chunk;
    filter.write(event.data); // Pass original data
  };

  filter.onstop = () => {
    console.log('Intercepted response body:', JSON.parse(responseText));
    filter.close();
  };
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {
    urls: [
      'https://www.rohlik.cz/services/frontend-service/v2/cart-review/check-cart',
    ],
    types: ['xmlhttprequest'],
  },
  ['blocking']
);

window.addEventListener('load', () => {
  fetch(
    'https://www.rohlik.cz/services/frontend-service/v2/cart-review/check-cart'
  )
    .then((response) => response.json())
    .then(({ data }) => {
      for (const item of Object.values(data.items)) {
        addToShoppingCart(item);
        // exclude notAvailableItems and multiply by quantity to get total
        // send shoppingCart via message to content.js
      }
    })
    .catch((error) => {
      console.error('Error fetching cart data:', error);
    });
});

console.log('Background script loaded');
console.log('Cart', shoppingCart);

// Need to inspect the extension in order to see the logs about:debugging#/runtime/this-firefox
// background scripts run on a separate, generated html page

// Using webRequest.filterResponseData will replace the MutationObserver implementation for handling cart data and state
