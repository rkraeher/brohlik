// @ts-check

/**
 * @typedef {Object} BackgroundMessageActions
 * @property {string} UPDATE_USER
 */

/**
 * @type {BackgroundMessageActions}
 */
const BACKGROUND_MESSAGE_ACTIONS = {
  UPDATE_USER: 'updateUser',
};

const CART_REVIEW_ENDPOINT =
  'https://www.rohlik.cz/services/frontend-service/v2/cart-review';

/**
 * @typedef {Object} CartItem
 * @property {string} [user]
 * @property {number} [price]
 * @property {number} [quantity]
 * @property {string} [productName]
 * @property {number} [productId]
 */

/**
 * @typedef {Object} CartData
 * @property {Object.<number, CartItem>} items
 * @property {Array<CartItem>} notAvailableItems
 */

/** @type {Record<number, CartItem>} */
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
function updateItem(item) {
  const { productId, price, quantity, productName, user } = item;
  const defaultUser = 'JT';
  if (!productId) return;

  console.log(user, shoppingCart);
  console.log(productName, !user && !shoppingCart[productId]?.user);

  // !! Try locally running the cookie-bg-picker to see if the messaging works
  if (!user && !shoppingCart[productId]?.user) {
    browser.tabs.query({ url: '*://*.rohlik.cz/*' }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs
            .sendMessage(tab.id, {
              action: 'injectBrohlikButton',
              productId,
            })
            .catch((err) => {
              console.warn('Could not send message to tab', tab.id, err);
            });
        }
      }
    });
  }

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

  // console.log('cart update', shoppingCart);
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

  filter.ondata = (event) => {
    let chunk = decoder.decode(event.data, { stream: true });
    response += chunk;
    filter.write(event.data); // pass through untouched
  };

  filter.onstop = () => {
    const data = JSON.parse(response)?.data;
    deleteRemovedItems(data);

    const availableItems = getAvailableItems(data);
    availableItems.forEach(updateItem);

    filter.close();
  };
}

async function initShoppingCart() {
  try {
    const response = await fetch(`${CART_REVIEW_ENDPOINT}/check-cart`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    /** @type {{ data: CartData }} */
    const { data } = await response.json();

    if (!data?.items || Object.keys(data.items).length === 0) {
      console.warn('Shopping cart is empty or unavailable.');
      return;
    }

    const availableItems = getAvailableItems(data);
    availableItems.forEach(addItem);

    // console.log('Shopping Cart initialised', shoppingCart);
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

browser.runtime.onMessage.addListener((message) => {
  if (message.action === BACKGROUND_MESSAGE_ACTIONS.UPDATE_USER) {
    updateItem({
      productId: message.productId,
      user: message.user,
    });
  }
});
