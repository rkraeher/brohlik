// for selector generation: npx playright codegen url
const priceStrings = [
  ...document.querySelectorAll('[data-test="actual-price"]'),
].map((el) => el.textContent);

const priceRegex = /\d*\.?,?\d+/;

const extractedPrices = priceStrings.map((str) => {
  const match = str.match(priceRegex);
  return match ? match[0] : null;
});

// console.log('dev', extractedPrices, priceStrings);

document.querySelectorAll('[data-test="counter"]').forEach((counterDiv) => {
  let nextSibling = counterDiv.nextElementSibling;

  while (nextSibling) {
    if (nextSibling.querySelector('[data-test="actual-price"]')) {
      break;
    }
    nextSibling = nextSibling.nextElementSibling;
  }

  if (counterDiv && nextSibling) {
    const newDiv = document.createElement('div');

    const button = document.createElement('button');
    button.textContent = 'JT';
    button.classList.add('brohlik');

    const options = ['JT', 'RK', 'Shared'];
    let index = 0;

    button.addEventListener('click', () => {
      index = (index + 1) % options.length;
      button.textContent = options[index];
    });

    newDiv.appendChild(button);

    counterDiv.parentNode.insertBefore(newDiv, nextSibling);

    // mobile first
    counterDiv.style.flex = '1 0 0%'; // add class and style from external style sheet
    counterDiv.style.justifyContent = 'flex-end';
    // responsive parent: counterDiv.parentNode.style.flexWrap = 'nowrap';
  }
});

browser.scripting.insertCSS({
  target: { allFrames: true },
  files: ['styles.css'],
});

// 1. add the additional column for 1, 2 or both users
// 3. styles
// 2. calculation algo
