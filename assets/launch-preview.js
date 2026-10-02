/* Launch preview: draft products shown for a sneak peek can't go in the cart.
   Loaded only when Theme settings → Launch preview is on. */
(() => {
  const msg = window.CloverPreviewMessage || 'Coming soon!';
  let timer;
  function toast() {
    const el = document.getElementById('Toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  // Card and cart-drawer "Add" buttons for preview items
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-preview-add]')) return;
    e.preventDefault();
    toast();
  });

  // Buy box: block adding a preview offer, and hide express checkout while one is selected
  const BuyForm = customElements.get('buy-form');
  if (BuyForm) {
    const submit = BuyForm.prototype.submit;
    BuyForm.prototype.submit = function (buyNow) {
      if (this.querySelector('.offer input:checked[data-preview]')) {
        this.showError(msg);
        toast();
        return;
      }
      return submit.call(this, buyNow);
    };
  }
  document.addEventListener('change', (e) => {
    const radio = e.target.closest('.offer input');
    if (!radio) return;
    const form = radio.closest('buy-form');
    const dynamic = form && form.querySelector('[data-dynamic-checkout]');
    const addon = form && form.querySelector('[data-addon-toggle]');
    if (dynamic) dynamic.hidden = !!radio.dataset.preview || !!(addon && addon.checked);
    if (form && !radio.dataset.preview && form.showError) form.showError('');
  });
})();
