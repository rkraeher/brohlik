const shoppingCart = {};

function initialiseShoppingCart(button, price) {
  shoppingCart[button.id] = { user: button.textContent, price };
}

function createBrohlikButton() {
  const button = document.createElement('button');
  const buttonId = window.crypto.randomUUID();
  button.id = buttonId;
  button.textContent = 'JT'; // first user or some default

  const options = ['JT', 'RK', 'Shared']; // Should be dynamically set in the extension settings
  const classes = ['user-one-btn', 'user-two-btn', 'shared-btn']; // user-green, user-blue, shared-pink...

  let index = 0;
  button.addEventListener('click', () => {
    button.classList.remove(classes[index]);
    index = (index + 1) % options.length;
    button.textContent = options[index];
    button.classList.add(classes[index]);
  });

  return button;
}

function extractPrice(priceString) {
  const cleanedString = priceString.replace(/\s/g, ''); // Remove any spaces inside numbers (e.g., "1 900" → "1900")
  const priceRegex = /\d+([.,]?\d+)?/;

  const match = cleanedString.match(priceRegex);
  if (match) {
    return parseFloat(match[0].replace(',', '.')); // Convert commas to dots for decimals
  } else {
    return null;
  }
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
      if (!actualPriceContainer) return;

      const initialPrice = extractPrice(
        actualPriceContainer.querySelector(actualPriceSelector).textContent
      );

      const brohlikContainer = document.createElement('div');
      brohlikContainer.classList.add('brohlik');

      const brohlikButton = createBrohlikButton();

      initialiseShoppingCart(brohlikButton, initialPrice);

      brohlikContainer.appendChild(brohlikButton);

      innerItemWrapper.classList.add('overrides');
      innerItemWrapper.insertBefore(brohlikContainer, actualPriceContainer);
    });
}

function handleItemChange(wrapper) {
  const priceElement = wrapper.querySelector('[data-test="actual-price"]');
  const price = extractPrice(priceElement.textContent);

  console.log(`Updated item: Price=${price}`);
  // Now update the shoppingCart state.
}

function trackItemChanges() {
  const itemWrappers = document.querySelectorAll('[data-test="item-wrapper"]');

  itemWrappers.forEach((wrapper) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          handleItemChange(wrapper);
        }
      });
    });

    observer.observe(wrapper, {
      childList: true, // Detect added/removed elements. Can we do this for the entire cart?
      attributes: true, // Detect attribute changes
      subtree: true, // Observe all child elements
    });
  });
}

injectBrohlikButtons();
trackItemChanges();

console.log('dev', shoppingCart);

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// TODO:
// 1. Handle dynamic shopping cart updates (IN PROGRESS)
// 2. Calculation algorithm
// 3. Totals UI
// 4. Config for users

// There are at least 4 possible update events:
//// 1. Quanity changes (so price updates)
//// 2. User changes
// 3. Item is removed
// Instead of tracking quantity = 0, we should check whole cart page for the item-wrapper (can use buttonId?)

// 4. Item is added (from the same page)

// Edgecases
// 1. Do not include when an item in cart is sold out
