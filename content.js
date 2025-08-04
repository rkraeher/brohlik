// @ts-check
/// <reference path="./browser.d.ts" />
/// <reference path="./types.d.ts" />

/**
 * Dispatches an update to the cart state handlers in background script.
 * @param {string} productId
 * @param {string} user
 */
function dispatchCartUpdate(productId, user) {
  browser.runtime.sendMessage({
    action: 'UPDATE_USER',
    productId,
    user,
  });
}

/**
 * Creates a button that toggles between users. Includes a click handler that dispatches the updated user to the cart.
 * @param {string} productId - The id of the product to associate with the button.
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
 * Helper for getting DOM elements we need for positioning injected brohlik button
 * Finds the next sibling container that matches the selector.
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
 * @param {string} productId - The productId to inject a button for.
 * @returns {void}
 */
function injectBrohlikButton(productId) {
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
 * Finds all unique productIds in the website cart and injects buttons for each.
 * @returns {void}
 */
function injectAllBrohlikButtons() {
  const productIdElements = document.querySelectorAll(
    '[data-test="counter"] [data-product-id]'
  );

  const uniqueProductIds = new Set();

  productIdElements.forEach((el) => {
    const id = el.getAttribute('data-product-id');
    if (id) uniqueProductIds.add(id);
  });

  uniqueProductIds.forEach(injectBrohlikButton);
}

/**
 * Handles messages sent from the background script and performs actions
 * @param {{ action: MessageAction, productId?: string }} message
 */
function handleBackgroundMessage(message) {
  if (!message?.action) return;

  switch (message.action) {
    case 'INJECT_ALL_BROHLIK_BUTTONS':
      setTimeout(injectAllBrohlikButtons, 2000);
      break;

    case 'INJECT_BROHLIK_BUTTON':
      setTimeout(
        () => message.productId && injectBrohlikButton(message.productId),
        2000
      );
      break;

    default:
      console.warn('Unknown message action:', message.action);
  }
}

browser.runtime.onMessage.addListener((message) => {
  try {
    handleBackgroundMessage(message);
  } catch (err) {
    console.error('Error handling background message:', err, message);
  }
});

// TODO:Display the totals in UI or in a popup

// Immediate TODOS:
//// 1. exclude notAvailableItems *DONE
// 2. handle "Keep in Cart" - Double check this case.
// Availablility change - keeps it in the cart on backend, but doesn't look like it in frontend and when we click 'Keep in Cart' it doesnt inject brohlik button

// // 3. handle when some other new item is added (some endpoint is called, brohlik button is not injected). (partially done, with window.location.reload)
// After/If we reload, we still need to persist the correct user for items

// Should normalise productId as ALWAYS a string (it can be a number when coming from rohlik api)

// Other TODOS:
//// - Calculation algorithm
// - Totals UI
// - Config for users
// - Add tests
