// @ts-check
/// <reference path="./browser.d.ts" />
/// <reference path="./types.d.ts" />

const CART_REVIEW_ENDPOINT =
  'https://www.rohlik.cz/services/frontend-service/v2/cart-review';

/**
 * Background script state store
 * @type ShoppingCart
 */
const shoppingCart = {};

/**
 * Add a new item to the shopping cart.
 * @param {CartItem} item
 */
function addItem(item) {
  const { productId, price, quantity, productName } = item;
  if (!productId) return;
  const defaultUser = 'JT';

  shoppingCart[productId] = {
    user: defaultUser,
    price,
    quantity,
    productName,
    productId,
  };
}

/**
 * Update an existing item in the shopping cart.
 * @param {CartItem} item
 */
async function updateItem(item) {
  async function dispatchButtonInjection() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
        url: '*://*.rohlik.cz/*',
      });

      await browser.tabs.sendMessage(tabs[0].id, {
        action: 'INJECT_BROHLIK_BUTTON',
        productId,
      });
      // message can also receive a response from the content script/message listener
    } catch (err) {
      console.warn('Could not send message to tab', err);
    }
  }

  const { productId, price, quantity, productName, user } = item;
  if (!productId) return;

  const defaultUser = 'JT';
  const isNewItem = !user && !shoppingCart[productId]?.user;

  if (isNewItem) await dispatchButtonInjection();

  /** @type CartItem */
  const updatedItem = {
    user: user || shoppingCart[productId]?.user || defaultUser,
    price,
    quantity,
    productName,
    productId,
  };

  Object.keys(updatedItem).forEach((key) => {
    if (updatedItem[key] == null) {
      delete updatedItem[key];
    }
  });

  shoppingCart[productId] = {
    ...shoppingCart[productId],
    ...updatedItem,
  };
}

/**
 * Delete items from shoppingCart state that have been removed from the client-side cart
 * @param {CartData} data
 */
function deleteRemovedItems(data) {
  const currentProductIds = new Set(Object.keys(data?.items || {}));

  Object.keys(shoppingCart).forEach((productId) => {
    if (!currentProductIds.has(productId)) {
      console.log('deleted item', shoppingCart[productId]);
      delete shoppingCart[productId];
    }
  });
}

/**
 * @param {CartData} data
 * @return {Array<CartItem>}
 */
function getAvailableItems(data) {
  const notAvailableItemIds = new Set(
    data?.notAvailableItems.map((item) => item.productId)
  );

  return Object.values(data?.items || {}).filter(
    (item) => !notAvailableItemIds.has(item.productId)
  );
}

/**
 * Intercepts cart data and updates the shopping cart.
 * @param {any} details
 */
function interceptor(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder('utf-8');
  let response = '';

  filter.ondata = (
    /** @type {{ data: AllowSharedBufferSource | undefined; }} */ event
  ) => {
    let chunk = decoder.decode(event.data, { stream: true });
    response += chunk;
    filter.write(event.data); // pass through untouched
  };

  filter.onstop = async () => {
    const data = JSON.parse(response)?.data;
    deleteRemovedItems(data);

    const availableItems = getAvailableItems(data);

    for (const item of availableItems) await updateItem(item);

    filter.close();
  };
}

async function initShoppingCart() {
  try {
    const response = await fetch(`${CART_REVIEW_ENDPOINT}/check-cart`);
    /** @type {{ data: CartData }} */
    const { data } = await response.json();

    const availableItems = getAvailableItems(data);
    availableItems.forEach(addItem);
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
}

browser.tabs.onUpdated.addListener(initShoppingCart);

browser.webRequest.onBeforeRequest.addListener(
  interceptor,
  {
    urls: [`${CART_REVIEW_ENDPOINT}/*`],
    types: ['xmlhttprequest'],
  },
  ['blocking']
);

/**
 * Handles messages sent from the content script and performs actions
 * @param {{ action: MessageAction, productId?: number, user?: string }} message
 */
function handleContentMessage(message) {
  console.log(message);
  if (message.action === 'UPDATE_USER' && message?.productId && message?.user) {
    updateItem({
      productId: message.productId,
      user: message.user,
    });
  }
}

browser.runtime.onMessage.addListener((message) => {
  try {
    handleContentMessage(message);
  } catch (err) {
    console.error('Error handling content message:', err, message);
  }
});
