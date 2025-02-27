// for selector generation: npx playwright codegen url

function getPriceStrings() {
  return [...document.querySelectorAll('[data-test="actual-price"]')].map(
    (el) => el.textContent
  );
}

function extractPrices(priceStrings) {
  const priceRegex = /\d*\.?,?\d+/;
  return priceStrings.map((str) => {
    const match = str.match(priceRegex);
    return match ? match[0] : null;
  });
}

function getActualPriceContainer(counterContainer) {
  let actualPriceContainer = counterContainer.nextElementSibling;
  while (actualPriceContainer) {
    if (actualPriceContainer.querySelector('[data-test="actual-price"]')) {
      return actualPriceContainer;
    }
    actualPriceContainer = actualPriceContainer.nextElementSibling;

    actualPriceDiv = actualPriceDiv.nextElementSibling;
  }
  return null;
}

function createBrohlikButton() {
  const button = document.createElement('button');
  button.textContent = 'JT';

  const options = ['JT', 'RK', 'Shared']; // Move to settings/config
  const classes = ['user-one-btn', 'user-two-btn', 'shared-btn'];

  let index = 0;
  button.addEventListener('click', () => {
    button.classList.remove(classes[index]);
    index = (index + 1) % options.length;
    button.textContent = options[index];
    button.classList.add(classes[index]);
  });

  return button;
}

function injectBrohlikButtons() {
  document
    .querySelectorAll('[data-test="counter"]')
    .forEach((counterContainer) => {
      const actualPriceContainer = getActualPriceContainer(counterContainer);
      if (!actualPriceContainer) return;

      // console.log(
      //   'dev actualPriceDiv.childNodes[0].lastChild.textContent',
      //   actualPriceDiv.childNodes[0].lastChild.textContent
      // );

      const actualPrice = getActualPrice(counterContainer);
      if (!actualPrice) return;

      console.log('dev', actualPrice);

      const existingBrohlikContainer =
        counterContainer.parentNode.querySelector('.brohlik');
      if (existingBrohlikContainer) existingBrohlikContainer.remove();

      const brohlikContainer = document.createElement('div');
      brohlikContainer.classList.add('brohlik');
      brohlikContainer.appendChild(createBrohlikButton());

      counterContainer.parentNode.classList.add('overrides');
      counterContainer.parentNode.insertBefore(
        brohlikContainer,
        actualPriceContainer
      );
    });
}

const priceStrings = getPriceStrings();
const extractedPrices = extractPrices(priceStrings);

injectBrohlikButtons();

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// TODO:
// 1. Styles
// 2. Calculation algorithm
