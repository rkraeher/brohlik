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

// can make it more abstract: get sibling container and pass the selecter
function getSiblingContainer(sibling, selector) {
  let container = sibling.nextElementSibling; // we need to use sibling of counter, because the actual-price is nested in two divs
  while (container) {
    // if (outerContainer.querySelector('[data-test="actual-price"]')) {
    if (container.querySelector(selector)) {
      return container;
    }
    container = container.nextElementSibling;
  }
  return null;
}

// why we need counterContainer? because its the level in dom we need to utilise
// or we could just access grandparent. Don't both rely on maintaining a certain dom structure?
// if so, which is more resilient and simpler?
// NOT having to use getSiblingContainer is simpler, and maybe they are equally as likely to be changed?
function injectBrohlikButtons() {
  document.querySelectorAll('[data-test="item-wrapper"]').forEach((wrapper) => {
    const existingBrohlikContainer = wrapper.querySelector('.brohlik');
    if (existingBrohlikContainer) existingBrohlikContainer.remove();

    const priceSpan = wrapper.querySelector('[data-test="actual-price"]');
    const counterContainer = wrapper.querySelector('[data-test="counter"]');

    // because its nested
    const priceContainer = getSiblingContainer(
      counterContainer,
      '[data-test="actual-price"]'
    );
    if (!priceSpan || !counterContainer) return;

    const initialPrice = extractPrice(priceSpan.textContent);

    const brohlikContainer = document.createElement('div');
    brohlikContainer.classList.add('brohlik');

    const brohlikButton = createBrohlikButton();
    initialiseShoppingCart(brohlikButton, initialPrice);

    brohlikContainer.appendChild(brohlikButton);

    console.log('dev', counterContainer, priceSpan, priceContainer);

    // innerItemWrapper
    counterContainer.parentNode.classList.add('overrides');
    counterContainer.parentNode.insertBefore(brohlikContainer, priceContainer);
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
  const priceSpan = wrapper.querySelector('[data-test="actual-price"]');
  const price = extractPrice(priceSpan.textContent);

  console.log('dev', `Updated item: Price=${price}`);
  // Now update the shoppingCart state.
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

// Stop@1350
// should we be looping item-wrapper instead of using counter and checking siblings?
