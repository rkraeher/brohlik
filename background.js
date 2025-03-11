const shoppingCart = {};
const CHECK_CART_ENDPOINT =
  'https://www.rohlik.cz/services/frontend-service/v2/cart-review/check-cart';

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

function interceptor(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder('utf-8');
  let response = '';

  filter.ondata = (event) => {
    let chunk = decoder.decode(event.data, { stream: true });
    response += chunk;
    filter.write(event.data); // Pass original data
  };

  filter.onstop = () => {
    console.log('Intercepted response body:', JSON.parse(response));
    // TODO: update the cart
    filter.close();
  };
}

async function initShoppingCart() {
  try {
    const response = await fetch(CHECK_CART_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const { data } = await response.json();

    if (!data?.items || Object.keys(data.items).length === 0) {
      console.warn('Shopping cart is empty or unavailable.');
      return;
    }

    for (const item of Object.values(data.items)) {
      addToShoppingCart(item);
      // TODO: exclude notAvailableItems and multiply by quantity to get total
    }
    console.log('Shopping Cart initialised', shoppingCart);
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
}

browser.tabs.onUpdated.addListener(initShoppingCart);
browser.webRequest.onBeforeRequest.addListener(
  interceptor,
  {
    urls: [CHECK_CART_ENDPOINT],
    types: ['xmlhttprequest'],
  },
  ['blocking']
);
