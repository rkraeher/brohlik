// for selector generation: npx playwright codegen url

const shoppingCart = {};

function extractPrice(priceString) {
  const priceRegex = /\d*\.?,?\d+/;

  const match = priceString.match(priceRegex);
  if (match) {
    return parseFloat(match[0].replace(',', '.'));
  } else return null;
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

function createBrohlikButton(actualPrice) {
  const button = document.createElement('button');
  const buttonId = window.crypto.randomUUID();
  button.id = buttonId;
  button.textContent = 'JT';

  shoppingCart[buttonId] = { user: button.textContent, actualPrice }; // must update if price changes. right now it only sets initial but doesn't update

  const options = ['JT', 'RK', 'Shared']; // Should be dynamically set in the extension settings
  const classes = ['user-one-btn', 'user-two-btn', 'shared-btn'];

  let index = 0;
  button.addEventListener('click', () => {
    button.classList.remove(classes[index]);

    index = (index + 1) % options.length;
    button.textContent = options[index];
    button.classList.add(classes[index]);

    shoppingCart[buttonId].user = button.textContent;
    console.log({ shoppingCart });
    //* Continue from here. Stop to plan out how to approach this instead of just mindlessly coding my way through it
    // It may make more sense to actually pass this event listener as a callback to the create button function,
    // because it also needs data from the 'actualPriceContainer' sibling
  });

  return button;
}

function injectBrohlikButtons() {
  document
    .querySelectorAll('[data-test="counter"]')
    .forEach((counterContainer) => {
      const actualPriceContainer = getActualPriceContainer(counterContainer);
      if (!actualPriceContainer) return;

      const actualPrice = extractPrice(
        actualPriceContainer.querySelector('[data-test="actual-price"]')
          .textContent
      );
      // console.log('dev', actualPrice);

      const existingBrohlikContainer =
        counterContainer.parentNode.querySelector('.brohlik');
      if (existingBrohlikContainer) existingBrohlikContainer.remove();

      const brohlikContainer = document.createElement('div');
      brohlikContainer.classList.add('brohlik');

      brohlikContainer.appendChild(createBrohlikButton(actualPrice));

      counterContainer.parentNode.classList.add('overrides');
      counterContainer.parentNode.insertBefore(
        brohlikContainer,
        actualPriceContainer
      );
    });
}

injectBrohlikButtons();

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// TODO:
// 1. Calculation algorithm
// 2. Handle dynamic shopping cart updates (adjusting quantities)
// 3. Config for users

// Ok so each button has props: actualPrice, user, id

//there are at least 4 possible update events:
// 1. Quanity changes (so price updates)
// 2. User changes
// 3. Item is removed
// 4. Item is added
// We need to attach an event listeners onto the site buttons that trigger these updates...
