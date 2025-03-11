const shoppingCart = {};
const CHECK_CART_ENDPOINT =
  'https://www.rohlik.cz/services/frontend-service/v2/cart-review/check-cart';

function addToShoppingCart(item) {
  shoppingCart[item.productId] = {
    user: 'JT', // first user or some default
    price: item.price,
    quantity: item.quantity,
  };
}

function updateShoppingCart(productId, data) {
  if (shoppingCart[productId]) {
    shoppingCart[productId] = {
      ...shoppingCart[productId],
      ...data,
    };
  } else {
    shoppingCart[productId] = data;
  }

  console.log('cart', 'update', shoppingCart);
}

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
    const items = JSON.parse(response)?.data?.items;
    console.log('Intercepted response body:', items);

    for (const item of Object.values(items)) {
      updateShoppingCart(item.productId, {
        price: item.price,
        quantity: item.quantity,
      });
    }

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

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateCart') {
    updateShoppingCart(message.productId, { user: message.user });
  }
});

browser.tabs.onUpdated.addListener(initShoppingCart);
browser.webRequest.onBeforeRequest.addListener(
  interceptor,
  {
    urls: [CHECK_CART_ENDPOINT],
    types: ['xmlhttprequest'],
  },
  ['blocking']
);
