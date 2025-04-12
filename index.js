// @ts-check

/**
 * Dispatches an update to the cart state handlers in background script.
 * @param {string} productId
 * @param {string} user
 */
function dispatchCartUpdate(productId, user) {
  browser.runtime.sendMessage({ action: 'updateCart', productId, user });
}

/**
 * Creates a button that toggles between users and updates the cart.
 * @param {string} productId - The ID of the product to associate with the button.
 * @returns {HTMLButtonElement}
 */
function createBrohlikButton(productId) {
  const button = document.createElement('button');
  const buttonId = window.crypto.randomUUID(); // do we even need buttonId if we use productId for the cart?
  button.id = buttonId;
  button.textContent = 'JT'; // first user or some default (can come from shoppingCart in background.js)

  const options = ['JT', 'RK', 'Shared']; // Should be dynamically set in the extension settings
  const classes = ['user-one-btn', 'user-two-btn', 'shared-btn']; // user-green, user-blue, shared-pink...

  let index = 0;
  button.addEventListener('click', () => {
    button.classList.remove(classes[index]);
    index = (index + 1) % options.length;

    button.textContent = options[index];
    dispatchCartUpdate(productId, options[index]);

    button.classList.add(classes[index]);
  });

  return button;
}

/**
 * Finds the next sibling container that matches the selector. Helps traverse the specific DOM structure of the cart
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
 * Injects the Brohlik buttons into the cart UI.
 */
function injectBrohlikButtons() {
  document
    .querySelectorAll('[data-test="counter"]')
    .forEach((counterContainer) => {
      if (!(counterContainer instanceof HTMLElement)) return;

      const actualPriceSelector = '[data-test="actual-price"]';
      const innerItemWrapper = counterContainer.parentNode;

      if (!(innerItemWrapper instanceof HTMLElement)) return;

      const existingBrohlikContainer =
        innerItemWrapper.querySelector('.brohlik');

      if (existingBrohlikContainer) existingBrohlikContainer.remove();

      const actualPriceContainer = getContainerSibling(
        counterContainer,
        actualPriceSelector
      );

      const updateQuantityButton =
        counterContainer.querySelector('[data-product-id]');
      const productId = updateQuantityButton
        ? updateQuantityButton.getAttribute('data-product-id')
        : null;

      if (!actualPriceContainer || !productId) return;

      const brohlikContainer = document.createElement('div');
      brohlikContainer.classList.add('brohlik');

      const brohlikButton = createBrohlikButton(productId);

      brohlikContainer.appendChild(brohlikButton);

      innerItemWrapper.classList.add('overrides');
      innerItemWrapper.insertBefore(brohlikContainer, actualPriceContainer);
    });
}

injectBrohlikButtons();

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// Immediate TODOS:
//// 1. exclude notAvailableItems
// 2. handle "Keep in Cart" - Double check this case. It should already be handled now with the expanded url
// 3. handle when some other new item is added (some endpoint is called, brohlik button is not injected and user is missing)

// Long term TODOS:
// - Calculation algorithm
// - Totals UI
// - Config for users

// Edgecases
// Keep in Cart button
// Not available for promotional price anymore (need to double check this one. Isn't it same as Keep in Cart?)
// // Empty the cart
