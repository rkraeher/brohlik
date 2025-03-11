function dispatchCartUpdate(productId, user) {
  browser.runtime.sendMessage({ action: 'updateCart', productId, user });
}

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

function getContainerSibling(reference, selector) {
  let sibling = reference.nextElementSibling;
  while (sibling) {
    if (sibling.querySelector(selector)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling;
  }
  return null;
}

function injectBrohlikButtons() {
  document
    .querySelectorAll('[data-test="counter"]')
    .forEach((counterContainer) => {
      const actualPriceSelector = '[data-test="actual-price"]';
      const innerItemWrapper = counterContainer.parentNode;

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

// Handle dynamic shopping cart updates (IN PROGRESS)

// There are at least 4 possible update events:
//// 1. Quanity changes (so price updates)
//// 2. User changes
// 3. Item is removed
// 4. Item is added (from the same page)

// TODO:
// - Calculation algorithm
// - Totals UI
// - Config for users

// Edgecases
// - Do not include when an item in cart is sold out

// Suggested Module Breakdown
//     cart.js - Shopping cart state management
//     ui.js - UI manipulation and button creation
//     dataExtraction.js - Price parsing and data retrieval
//     events.js - Tracking changes to the cart
