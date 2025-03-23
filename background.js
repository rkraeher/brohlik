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

//!! When a new item is added from page, it's added without user name or brohlik button
function updateShoppingCart(productId, updates) {
  shoppingCart[productId] = {
    ...shoppingCart[productId],
    ...updates,
  };

  console.log('cart update', shoppingCart);
}

function removeDeletedItems(currentProductIds) {
  Object.keys(shoppingCart).forEach((productId) => {
    if (!currentProductIds.has(productId)) {
      delete shoppingCart[productId];
    }
  });
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
    console.log('Intercepted response body:', JSON.parse(response)?.data);

    const currentProductIds = new Set(Object.keys(items || {}));

    removeDeletedItems(currentProductIds);

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

    // ok so both price changed and sold out items are put into this array
    // but unsure if "Keep in Cart" button will re-call the endpoint or a different one
    // Also, using "Keep in Cart" or adding from suggested productsadds it to cart but no brohlik button is injected
    const notAvailableItems = data?.notAvailableItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
    }));

    console.log({ notAvailableItems });

    for (const item of Object.values(data.items)) {
      addToShoppingCart(item);
      // exclude notAvailableItems
      // multiply by quantity to get total
    }
    console.log('Shopping Cart initialised', shoppingCart);
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateCart') {
    updateShoppingCart(message.productId, { user: message.user }); // default user here?
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
