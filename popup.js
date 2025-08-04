document.addEventListener('DOMContentLoaded', async () => {
  const backgroundPage = await browser.runtime.getBackgroundPage();
  const totals = backgroundPage.calculateTotals();

  document.getElementById('rk-total').textContent = `${totals.RK.toFixed(
    2
  )} Kč`;
  document.getElementById('jt-total').textContent = `${totals.JT.toFixed(
    2
  )} Kč`;
  document.getElementById(
    'shared-total'
  ).textContent = `${totals.Shared.toFixed(2)} Kč`;
});
