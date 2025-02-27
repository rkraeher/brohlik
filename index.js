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

function getActualPriceDiv(counterDiv) {
  let actualPriceDiv = counterDiv.nextElementSibling;
  while (actualPriceDiv) {
    if (actualPriceDiv.querySelector('[data-test="actual-price"]')) {
      return actualPriceDiv;
    }
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
  document.querySelectorAll('[data-test="counter"]').forEach((counterDiv) => {
    const actualPriceDiv = getActualPriceDiv(counterDiv);
    if (!actualPriceDiv) return;

    //  Remove any pre-existing buttons before injecting the new ones?
    const brohlikDiv = document.createElement('div');
    brohlikDiv.classList.add('brohlik');
    brohlikDiv.appendChild(createBrohlikButton());

    counterDiv.parentNode.classList.add('overrides');
    counterDiv.parentNode.insertBefore(brohlikDiv, actualPriceDiv);
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
