// for selector generation: npx playwright codegen url

const shoppingCart = {};

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

function initialiseShoppingCart(button, { price, quantity }) {
  // do we actually need to store quantity or just track if it changes - its useless for the math
  shoppingCart[button.id] = { user: button.textContent, price, quantity };
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

function getActualPriceContainer(counterContainer) {
  let actualPriceContainer = counterContainer.nextElementSibling;
  while (actualPriceContainer) {
    if (actualPriceContainer.querySelector('[data-test="actual-price"]')) {
      return actualPriceContainer;
    }
    actualPriceContainer = actualPriceContainer.nextElementSibling;
  }
  return null;
}

function injectBrohlikButtons() {
  document
    .querySelectorAll('[data-test="counter"]')
    // should we be looping item-wrapper instead of using counter and checking siblings?
    .forEach((counterContainer) => {
      const existingBrohlikContainer =
        counterContainer.parentNode.querySelector('.brohlik');
      if (existingBrohlikContainer) existingBrohlikContainer.remove();

      const actualPriceContainer = getActualPriceContainer(counterContainer);
      if (!actualPriceContainer) return;

      const initialPrice = extractPrice(
        actualPriceContainer.querySelector('[data-test="actual-price"]')
          .textContent
      );

      const quantityElement = counterContainer.querySelector(
        '[data-test="item-counter-input"]'
      );
      const initialQuantity = quantityElement
        ? parseInt(quantityElement.value, 10)
        : 0;

      const brohlikContainer = document.createElement('div');
      brohlikContainer.classList.add('brohlik');

      const brohlikButton = createBrohlikButton();

      initialiseShoppingCart(brohlikButton, {
        price: initialPrice,
        quantity: initialQuantity,
      });

      brohlikContainer.appendChild(brohlikButton);

      counterContainer.parentNode.classList.add('overrides');
      counterContainer.parentNode.insertBefore(
        brohlikContainer,
        actualPriceContainer
      );
    });
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

function handleItemChange(wrapper) {
  const quantityElement = wrapper.querySelector(
    '[data-test="item-counter-input"]'
  );
  const quantity = quantityElement ? parseInt(quantityElement.value, 10) : 0;

  const priceElement = wrapper.querySelector('[data-test="actual-price"]');
  const price = extractPrice(priceElement.textContent);

  console.log('Update', priceElement.textContent);
  console.log(`Updated item: Quantity=${quantity}, Price=${price}`);
  // Now update your extension state accordingly
}

injectBrohlikButtons();
trackItemChanges();

console.log('dev', shoppingCart);

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// TODO:
// 1. Handle dynamic shopping cart updates
// 2. Calculation algorithm
// 3. Totals UI
// 4. Config for users

// There are at least 4 possible update events:
//// 1. Quanity changes (so price updates)
//// 2. User changes
// 3. Item is removed
// 4. Item is added

// Edgecases
// 1. Do not include when an item in cart is sold out

// Stop@1350
