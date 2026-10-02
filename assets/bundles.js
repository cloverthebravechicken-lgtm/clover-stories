/* Cart drawer: swap the book for the book + plush bundle in one tap. */
(() => {
  const routes = (window.Clover && Clover.routes) || { cartAdd: '/cart/add', cartChange: '/cart/change' };
  const post = async (url, body) => {
    const res = await fetch(url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || 'Something went wrong');
    return data;
  };
  const toast = (msg) => {
    const el = document.getElementById('Toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 3200);
  };

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-bundle-upgrade]');
    if (!btn) return;
    e.preventDefault();
    btn.disabled = true;
    btn.classList.add('is-loading');
    const drawer = document.getElementById('CartDrawer');
    const section = drawer && drawer.closest('[id^="shopify-section-"]');
    const sid = section ? section.id.replace('shopify-section-', '') : 'cart-drawer';
    try {
      // Add the bundle first so the book is never removed if the bundle can't be added.
      await post(routes.cartAdd, { items: [{ id: Number(btn.dataset.variant), quantity: 1 }] });
      const data = await post(routes.cartChange, {
        id: btn.dataset.key,
        quantity: Math.max(0, Number(btn.dataset.qty) - 1),
        sections: sid,
        sections_url: window.location.pathname
      });
      if (document.body.classList.contains('template-cart')) { window.location.reload(); return; }
      const html = data.sections && data.sections[sid];
      const fresh = html && new DOMParser().parseFromString(html, 'text/html').querySelector('#CartDrawer');
      if (fresh && drawer) {
        const wasOpen = drawer.classList.contains('is-open');
        drawer.innerHTML = fresh.innerHTML;
        if (wasOpen) drawer.classList.add('is-open');
      }
      toast('Upgraded to the book + plush bundle! 🧸');
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });
})();
