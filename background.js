const shoppingCart = {};
const CHECK_CART_ENDPOINT =
  'https://www.rohlik.cz/services/frontend-service/v2/cart-review/check-cart';

function addItem(item) {
  shoppingCart[item.productId] = {
    user: 'JT', // first user or some default
    price: item.price,
    quantity: item.quantity,
    productId: item.productId,
    name: item.productName,
  };
}

//!! When a new item is added from page, it's added without user name or brohlik button
// Check which endpoint is called when adding from page
// Then add it to cart with default user
// Send message to front end to inject brohlik button
function updateItem(item) {
  shoppingCart[item.productId] = {
    ...shoppingCart[item.productId],
    ...item,
  };

  console.log('cart update', shoppingCart);
}

function deleteRemovedItems(data) {
  const currentProductIds = new Set(Object.keys(data?.items || {}));

  Object.keys(shoppingCart).forEach((productId) => {
    if (!currentProductIds.has(productId)) {
      delete shoppingCart[productId];
    }
  });
}

function processAvailableItems(data, handler) {
  const notAvailableItemIds = new Set(
    data?.notAvailableItems.map((item) => item.productId)
  );

  const availableItems = Object.values(data?.items).filter(
    (item) => !notAvailableItemIds.has(item.productId)
  );

  availableItems.forEach((item) => {
    handler({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    });
  });
}

function interceptor(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder('utf-8');
  let response = '';

  filter.ondata = (event) => {
    let chunk = decoder.decode(event.data, { stream: true });
    response += chunk;
    filter.write(event.data); // Pass original data so regular request flow is not disrupted
  };

  filter.onstop = () => {
    const data = JSON.parse(response)?.data;

    deleteRemovedItems(data);
    processAvailableItems(data, updateItem);

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
    processAvailableItems(data, addItem);

    console.log('Shopping Cart initialised', shoppingCart);
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateCart') {
    updateItem({
      productId: message.productId,
      user: message.user,
    });
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
