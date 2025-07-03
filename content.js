// @ts-check
/// <reference path="./browser.d.ts" />

/**
 * @typedef {Object} ContentMessageActions
 * @property {string} UPDATE_USER
 */

/**
 * @type {ContentMessageActions}
 */
const CONTENT_MESSAGE_ACTIONS = {
  UPDATE_USER: 'updateUser',
};

/**
 * Dispatches an update to the cart state handlers in background script.
 * @param {string} productId
 * @param {string} user
 */
function dispatchCartUpdate(productId, user) {
  browser.runtime.sendMessage({
    action: CONTENT_MESSAGE_ACTIONS.UPDATE_USER,
    productId,
    user,
  });
}

/**
 * Creates a button that toggles between users. Includes a click handler that dispatches the updated user to the cart.
 * @param {string} productId - The ID of the product to associate with the button.
 * @returns {HTMLButtonElement}
 */
function createBrohlikButton(productId) {
  function updateUser() {
    button.classList.remove(classes[index]);
    index = (index + 1) % users.length;

    button.textContent = users[index];
    dispatchCartUpdate(productId, users[index]);

    button.classList.add(classes[index]);
  }

  const button = document.createElement('button');
  const buttonId = window.crypto.randomUUID(); // do we even need buttonId if we use productId for the cart?
  button.id = buttonId;
  button.textContent = 'JT'; // first user or some default (can come from shoppingCart in background.js)

  const users = ['JT', 'RK', 'Shared']; // Should be dynamically set in the extension settings
  const classes = ['user-one-btn', 'user-two-btn', 'shared-btn']; // user-green, user-blue, shared-pink...

  let index = 0;
  button.addEventListener('click', updateUser);

  return button;
}

/**
 * Finds the next sibling container that matches the selector.
 * Helper for getting DOM elements we need for positioning injected brohlik button
 * @param {HTMLElement} reference - The reference element to search from.
 * @param {string} selector - The CSS selector to match sibling elements.
 * @returns {HTMLElement | null}
 */
function getContainerSibling(reference, selector) {
  let sibling = reference.nextElementSibling;
  while (sibling) {
    if (sibling instanceof HTMLElement && sibling.querySelector(selector)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }
  return null;
}

/**
 * Extracts and returns references related to a counter container element.
 * These references are used to position the injected brohlik button in the DOM
 * @param {HTMLElement} counterContainer
 * @returns {{
 *   innerItemWrapper: HTMLElement,
 *   existingBrohlik: HTMLElement | Element | null,
 *   actualPriceContainer: HTMLElement | null
 * } | null}
 */
function getCounterDOMRefs(counterContainer) {
  const innerItemWrapper = counterContainer?.parentNode;
  if (!(innerItemWrapper instanceof HTMLElement)) return null;

  const existingBrohlik = innerItemWrapper.querySelector('.brohlik');
  const actualPriceContainer = getContainerSibling(
    counterContainer,
    '[data-test="actual-price"]'
  );

  return {
    innerItemWrapper,
    existingBrohlik,
    actualPriceContainer,
  };
}

/**
 * Locates the counter container for a given product ID.
 * @param {string} productId
 * @returns {HTMLElement | null} - The matching counter container or null.
 */
function findCounterContainer(productId) {
  return (
    document
      .querySelector(`[data-test="counter"] [data-product-id="${productId}"]`)
      ?.closest('[data-test="counter"]') || null
  );
}

/**
 * Injects the toggle button for a specific item row.
 * @param {string} productId - The product ID to inject a button for.
 * @returns {void}
 */
function injectButtonIntoItemRow(productId) {
  const counterContainer = findCounterContainer(productId);
  if (!counterContainer || !(counterContainer instanceof HTMLElement)) return;

  const refs = getCounterDOMRefs(counterContainer);
  if (!refs?.actualPriceContainer) return;

  const { innerItemWrapper, existingBrohlik, actualPriceContainer } = refs;

  // Cleanup to avoid duplicate injected buttons
  if (existingBrohlik) existingBrohlik.remove();

  const brohlikContainer = document.createElement('div');
  brohlikContainer.classList.add('brohlik');

  const brohlikButton = createBrohlikButton(productId);
  brohlikContainer.appendChild(brohlikButton);

  innerItemWrapper.classList.add('overrides');
  innerItemWrapper.insertBefore(brohlikContainer, actualPriceContainer);
}

/**
 * Finds all unique product IDs in the UI cart and injects buttons for each.
 * @returns {void}
 */
function injectBrohlikButtons() {
  const productIdElements = document.querySelectorAll(
    '[data-test="counter"] [data-product-id]'
  );

  const uniqueProductIds = new Set();

  productIdElements.forEach((el) => {
    const id = el.getAttribute('data-product-id');
    if (id) uniqueProductIds.add(id);
  });

  uniqueProductIds.forEach((productId) => {
    injectButtonIntoItemRow(productId);
  });
}

injectBrohlikButtons();

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

browser.runtime.onMessage.addListener((message) => {
  console.log('message', message);
  if (message.action === 'injectBrohlikButton' && message.productId) {
    // injectButtonIntoItemRow(message.productId);
  }
});

console.log('Brohlik content script loaded');
// Immediate TODOS:
//// 1. exclude notAvailableItems
//// 2. handle "Keep in Cart" - Double check this case. It should already be handled now with the expanded url
// 3. handle when some other new item is added (some endpoint is called, brohlik button is not injected)

// Long term TODOS:
// - Calculation algorithm
// - Totals UI
// - Config for users

// Edgecases
//// Keep in Cart button
// // Empty the cart
// Not available for promotional price anymore (need to double check this one. Isn't it same as Keep in Cart?)
