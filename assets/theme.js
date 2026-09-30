/* Clover Brave theme — vanilla JS, no dependencies */
(() => {
  const C = window.Clover || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.Shopify && Shopify.designMode) document.body.classList.add('shopify-design-mode');

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#Toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  /* ---------- Feather confetti ---------- */
  function confetti(originEl) {
    if (!C.confetti || reduceMotion) return;
    const rect = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const x0 = rect.left + rect.width / 2;
    const y0 = rect.top + rect.height / 2;
    const bits = ['🪶', '⭐', '💛', '🐣', '✨'];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('span');
      el.className = 'feather-confetti';
      el.textContent = bits[i % bits.length];
      el.style.left = x0 + 'px';
      el.style.top = y0 + 'px';
      document.body.appendChild(el);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 140;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 80;
      el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 160}px)) scale(.8) rotate(${Math.random() * 540}deg)`, opacity: 0 }
        ],
        { duration: 1200 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.4,1)' }
      ).onfinish = () => el.remove();
    }
  }

  /* ---------- Cart API ---------- */
  const cartDrawer = () => $('#CartDrawer');
  const drawerSectionId = () => {
    const el = cartDrawer();
    const sec = el && el.closest('[id^="shopify-section-"]');
    return sec ? sec.id.replace('shopify-section-', '') : 'cart-drawer';
  };

  function renderDrawer(html) {
    if (!html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('#CartDrawer');
    const current = cartDrawer();
    if (!fresh || !current) return;
    const wasOpen = current.classList.contains('is-open');
    current.innerHTML = fresh.innerHTML;
    if (wasOpen) current.classList.add('is-open');
  }

  function updateCount(count) {
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-empty', count === 0);
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    });
  }

  async function refreshCount() {
    try {
      const res = await fetch(C.routes.cart + '.js', { headers: { Accept: 'application/json' } });
      const cart = await res.json();
      updateCount(cart.item_count);
      return cart;
    } catch (e) { /* noop */ }
  }

  async function addItems(items) {
    const sid = drawerSectionId();
    const res = await fetch(C.routes.cartAdd + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items, sections: sid, sections_url: window.location.pathname })
    });
    const data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || 'Something went wrong');
    if (data.sections) renderDrawer(data.sections[sid]);
    await refreshCount();
    document.dispatchEvent(new CustomEvent('clover:cart-added', { detail: { items } }));
    return data;
  }

  async function changeLine(line, quantity) {
    const drawer = cartDrawer();
    drawer && drawer.classList.add('is-loading');
    const sid = drawerSectionId();
    try {
      const res = await fetch(C.routes.cartChange + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity, sections: sid, sections_url: window.location.pathname })
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message);
      if (data.sections) renderDrawer(data.sections[sid]);
      updateCount(data.item_count);
    } catch (e) {
      toast(e.message || 'Could not update your basket');
    } finally {
      drawer && drawer.classList.remove('is-loading');
    }
  }

  /* ---------- Drawer open/close ---------- */
  let lastFocus;
  function openDrawer() {
    const d = cartDrawer();
    if (!d) return (window.location.href = C.routes.cart);
    lastFocus = document.activeElement;
    d.classList.add('is-open');
    d.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    const panel = $('.drawer__panel', d);
    panel && panel.focus();
  }
  function closeDrawer() {
    const d = cartDrawer();
    if (!d) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  function afterAdd(btn) {
    confetti(btn);
    if (C.cartDrawer && cartDrawer()) {
      setTimeout(openDrawer, reduceMotion ? 0 : 350);
    } else {
      toast('Added to your basket! 🐔');
    }
  }

  document.addEventListener('click', async (e) => {
    const t = e.target;
    const open = t.closest('[data-cart-open]');
    if (open && C.cartDrawer && cartDrawer()) {
      e.preventDefault();
      openDrawer();
      return;
    }
    if (t.closest('[data-cart-close]')) {
      e.preventDefault();
      closeDrawer();
      return;
    }
    const lc = t.closest('[data-line-change]');
    if (lc) {
      const line = Number(lc.closest('[data-line]').dataset.line);
      changeLine(line, Number(lc.dataset.lineChange));
      return;
    }
    const qa = t.closest('[data-quick-add]');
    if (qa) {
      e.preventDefault();
      qa.classList.add('is-loading');
      qa.disabled = true;
      try {
        await addItems([{ id: Number(qa.dataset.quickAdd), quantity: 1 }]);
        afterAdd(qa);
      } catch (err) {
        toast(err.message);
      } finally {
        qa.classList.remove('is-loading');
        qa.disabled = false;
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeNav();
    }
  });

  /* ---------- Inscription name → order notes ---------- */
  async function addInscriptionNote(rawName) {
    const name = (rawName || '').trim();
    if (!name) return;
    try {
      const cart = await (await fetch(C.routes.cart + '.js', { headers: { Accept: 'application/json' } })).json();
      const line = 'Inscription for signed book: ' + name;
      const current = cart.note || '';
      if (current.includes(line)) return;
      const note = current ? current + '\n' + line : line;
      await fetch(C.routes.cart + '/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note })
      });
    } catch (e) { /* the inscription is still saved on the line item */ }
  }

  /* ---------- Empty basket quick-add card ---------- */
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-qc-addon]');
    if (!t) return;
    const card = t.closest('[data-qcard]');
    const field = card.querySelector('[data-qc-field]');
    field.hidden = !t.checked;
    if (t.checked) card.querySelector('[data-qc-name]').focus();
  });
  document.addEventListener('input', (e) => {
    const t = e.target.closest('[data-qc-name]');
    if (t) t.closest('[data-qcard]').querySelector('[data-qc-error]').hidden = true;
  });
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-qc-add]');
    if (!btn) return;
    const card = btn.closest('[data-qcard]');
    const addon = card.querySelector('[data-qc-addon]');
    const nameInput = card.querySelector('[data-qc-name]');
    const err = card.querySelector('[data-qc-error]');
    const items = [{ id: Number(btn.dataset.qcAdd), quantity: 1 }];
    if (addon && addon.checked) {
      const name = nameInput.value.trim();
      if (!name) {
        err.textContent = 'Who should Melanie sign the book to? Add a name so we can personalize it.';
        err.hidden = false;
        nameInput.focus();
        return;
      }
      items.push({ id: Number(addon.value), quantity: 1, properties: { 'Inscription for': name } });
    }
    err.hidden = true;
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      await addItems(items);
      if (addon && addon.checked) await addInscriptionNote(nameInput.value);
      if (!cartDrawer() || !cartDrawer().classList.contains('is-open')) {
        if (document.body.classList.contains('template-cart')) { window.location.reload(); return; }
      }
      confetti(btn.isConnected ? btn : cartDrawer());
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });

  /* ---------- Buy form ---------- */
  class BuyForm extends HTMLElement {
    connectedCallback() {
      this.form = $('form', this);
      if (!this.form) return;
      this.idInput = $('[data-variant-input]', this);
      this.addBtn = $('[data-add-btn]', this);
      this.error = $('[data-form-error]', this);
      this.qty = $('[data-qty-input]', this);
      this.addonToggle = $('[data-addon-toggle]', this);
      this.addonField = $('[data-addon-field]', this);
      this.addonName = $('[data-addon-name]', this);
      this.dynamic = $('[data-dynamic-checkout]', this);
      this.priceTargets = $$('[data-live-price], [data-satc-price]', this.closest('.shopify-section') || document);

      $$('.offer input', this).forEach((r) => r.addEventListener('change', () => this.syncOffer()));
      this.syncOffer();

      const variantsJson = $('[data-variants]', this);
      if (variantsJson) {
        this.variants = JSON.parse(variantsJson.textContent);
        $$('[data-option]', this).forEach((r) => r.addEventListener('change', () => this.syncVariant()));
      }

      $('[data-qty-minus]', this)?.addEventListener('click', () => { this.qty.value = Math.max(1, Number(this.qty.value) - 1); });
      $('[data-qty-plus]', this)?.addEventListener('click', () => { this.qty.value = Math.min(99, Number(this.qty.value) + 1); });

      if (this.addonToggle) {
        this.addonToggle.addEventListener('change', () => {
          const on = this.addonToggle.checked;
          this.addonField.hidden = !on;
          // Express checkout can't carry the add-on, so hide it while the add-on is selected.
          if (this.dynamic) this.dynamic.hidden = on;
          if (on) this.addonName.focus();
        });
      }

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submit(false);
      });
      $('[data-buy-now]', this)?.addEventListener('click', () => this.submit(true));
    }

    syncOffer() {
      const checked = $('.offer input:checked', this);
      if (!checked) return;
      this.idInput.value = checked.value;
      this.setPrice(checked.dataset.price);
    }

    syncVariant() {
      const selected = $$('[data-option]:checked', this).map((r) => r.value);
      const v = this.variants.find((v) => v.options.every((o, i) => o === selected[i]));
      if (!v) return;
      this.idInput.value = v.id;
      this.addBtn.disabled = !v.available;
      $('.btn__label', this.addBtn).textContent = v.available ? this.addBtn.dataset.label || 'Add to cart' : 'Sold out';
      this.setPrice(this.formatMoney(v.price));
      const url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      history.replaceState({}, '', url);
    }

    formatMoney(cents) {
      return (cents / 100).toLocaleString(document.documentElement.lang || 'en', { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD' });
    }

    setPrice(text) {
      if (!text) return;
      this.priceTargets.forEach((el) => {
        const now = el.querySelector('.price__now');
        (now || el).textContent = text;
      });
    }

    items() {
      const items = [{ id: Number(this.idInput.value), quantity: Math.max(1, Number(this.qty ? this.qty.value : 1)) }];
      if (this.addonToggle && this.addonToggle.checked) {
        const name = (this.addonName.value || '').trim();
        const item = { id: Number(this.addonToggle.value), quantity: 1 };
        if (name) item.properties = { 'Inscription for': name };
        items.push(item);
      }
      return items;
    }

    async submit(buyNow) {
      if (this.addonToggle && this.addonToggle.checked && !this.addonName.value.trim()) {
        this.showError('Who should Melanie sign the book to? Add a name so we can personalize it.');
        this.addonName.focus();
        return;
      }
      this.showError('');
      this.addBtn.classList.add('is-loading');
      this.addBtn.disabled = true;
      try {
        await addItems(this.items());
        await this.noteInscription();
        if (buyNow) {
          window.location.href = '/checkout';
          return;
        }
        afterAdd(this.addBtn);
      } catch (err) {
        this.showError(err.message);
      } finally {
        this.addBtn.classList.remove('is-loading');
        this.addBtn.disabled = false;
      }
    }

    async noteInscription() {
      if (!this.addonToggle || !this.addonToggle.checked) return;
      await addInscriptionNote(this.addonName.value);
    }

    showError(msg) {
      if (!this.error) return;
      this.error.textContent = msg;
      this.error.hidden = !msg;
    }
  }
  customElements.define('buy-form', BuyForm);

  /* ---------- Sticky add-to-cart ---------- */
  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const section = this.closest('.shopify-section') || document;
      const form = $('buy-form', section);
      const btn = $('[data-satc-btn]', this);
      if (!form) return;
      this.hidden = false;
      const target = $('[data-add-btn]', form);
      const io = new IntersectionObserver(([entry]) => {
        const below = entry.boundingClientRect.top < 0;
        this.classList.toggle('is-visible', !entry.isIntersecting && below);
      });
      io.observe(target);
      btn.addEventListener('click', () => {
        if (form.addonToggle && form.addonToggle.checked && !form.addonName.value.trim()) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.submit(false);
      });
    }
  }
  customElements.define('sticky-atc', StickyAtc);

  /* ---------- Flipbook ---------- */
  class FlipBook extends HTMLElement {
    connectedCallback() {
      this.leaves = $$('.fb__leaf', this);
      this.total = this.leaves.length;
      this.current = 0;
      try { this.spreads = JSON.parse($('[data-fb-spreads]', this).textContent); } catch (e) { this.spreads = []; }
      this.btnNext = $('[data-fb-next]', this);
      this.btnPrev = $('[data-fb-prev]', this);
      this.btnZoom = $('[data-fb-zoom]', this);
      this.btnNext.addEventListener('click', () => (this.current >= this.total ? this.restart() : this.next()));
      this.btnPrev.addEventListener('click', () => this.prev());
      this.btnZoom.addEventListener('click', () => this.zoom());
      this.leaves.forEach((leaf, i) => {
        leaf.addEventListener('click', (e) => {
          if (e.target.closest('button, a')) return;
          i < this.current ? this.prev() : this.next();
        });
      });
      const stage = $('[data-fb-stage]', this);
      let x0 = null;
      stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) (dx < 0 ? this.next() : this.prev());
        x0 = null;
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') this.next();
        if (e.key === 'ArrowLeft') this.prev();
      });
      if (this.dataset.autoplay === 'true' && 'IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver(([en]) => {
          if (en.isIntersecting) {
            io.disconnect();
            setTimeout(() => { if (this.current === 0) this.next(); }, 500);
          }
        }, { threshold: 0.6 });
        io.observe(stage);
      }
      this.update();
    }

    settle(leaf, i) {
      const done = () => {
        leaf.classList.remove('is-turning');
        leaf.style.zIndex = leaf.classList.contains('is-flipped') ? 10 + i : 10 + this.total - i;
      };
      leaf.addEventListener('transitionend', done, { once: true });
      setTimeout(done, reduceMotion ? 0 : 1200);
    }

    flip(i, flipped) {
      const leaf = this.leaves[i];
      if (!leaf) return;
      leaf.style.zIndex = 100;
      leaf.classList.add('is-turning');
      leaf.classList.toggle('is-flipped', flipped);
      this.settle(leaf, i);
    }

    next() {
      if (this.current >= this.total) return;
      this.flip(this.current, true);
      this.current++;
      this.update();
    }

    prev() {
      if (this.current <= 0) return;
      this.current--;
      this.flip(this.current, false);
      this.update();
    }

    restart() {
      const steps = this.current;
      for (let n = 0; n < steps; n++) setTimeout(() => this.prev(), n * 250);
    }

    zoom() {
      const idx = this.current - 1;
      const src = this.spreads[idx];
      const dlg = $('[data-lightbox-dialog]', this.closest('.shopify-section') || document);
      if (!src || !dlg || !dlg.showModal) return;
      const img = $('[data-lightbox-img]', dlg);
      img.src = src;
      img.alt = 'Pages from the book';
      dlg.showModal();
    }

    update() {
      this.classList.toggle('is-closed', this.current === 0);
      this.leaves.forEach((l, i) => l.classList.toggle('is-next', i === this.current));
      $('[data-fb-label-open]', this).hidden = this.current !== 0;
      $('[data-fb-label-next]', this).hidden = this.current === 0 || this.current >= this.total;
      $('[data-fb-label-restart]', this).hidden = this.current < this.total;
      this.btnPrev.disabled = this.current === 0;
      this.btnZoom.hidden = !(this.current >= 1 && this.current <= this.spreads.length);
    }
  }
  customElements.define('flip-book', FlipBook);

  /* ---------- Sticky header shadow ---------- */
  class StickyHeader extends HTMLElement {
    connectedCallback() {
      const onScroll = () => this.classList.toggle('is-scrolled', window.scrollY > 10);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }
  customElements.define('sticky-header', StickyHeader);

  /* ---------- Mobile nav ---------- */
  function closeNav() {
    const nav = $('#MobileNav');
    if (!nav || nav.hidden) return;
    nav.hidden = true;
    $('[data-nav-open]')?.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-nav-open]')) {
      const nav = $('#MobileNav');
      nav.hidden = false;
      e.target.closest('[data-nav-open]').setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      $('.mnav__close', nav).focus();
    } else if (e.target.closest('[data-nav-close]') || e.target.classList.contains('mnav') || e.target.closest('.mnav__list a')) {
      closeNav();
    }
  });

  /* ---------- Announcement rotator ---------- */
  $$('[data-rotator]').forEach((track) => {
    const msgs = $$('.announce__msg', track);
    if (msgs.length < 2) return;
    let i = 0;
    setInterval(() => {
      const cur = msgs[i];
      i = (i + 1) % msgs.length;
      cur.classList.remove('is-active');
      cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 500);
      msgs[i].classList.add('is-active');
    }, Number(track.dataset.interval) || 4000);
  });

  /* ---------- Hero slideshow ---------- */
  $$('[data-slideshow]').forEach((show) => {
    const slides = $$('.hero__slide', show);
    const dots = $$('.hero__dot', show);
    if (slides.length < 2) return;
    let i = 0;
    let timer;
    const go = (n) => {
      slides[i].classList.remove('is-active');
      dots[i] && dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      dots[i] && dots[i].classList.add('is-active');
    };
    const start = () => {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => go(i + 1), Number(show.dataset.interval) || 4000);
    };
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.slideTo)); start(); }));
    let x0 = null;
    show.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    show.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); start(); }
      x0 = null;
    });
    start();
  });

  /* ---------- Rails (prev/next + product gallery thumbs) ---------- */
  $$('[data-rail]').forEach((rail) => {
    const section = rail.closest('.shopify-section') || document;
    const step = () => {
      const child = rail.firstElementChild;
      return child ? child.getBoundingClientRect().width + 18 : rail.clientWidth * 0.8;
    };
    $('[data-rail-prev]', section)?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]', section)?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));

    if (rail.hasAttribute('data-gallery')) {
      const thumbs = $$('[data-thumb]', section);
      thumbs.forEach((t) => t.addEventListener('click', () => {
        rail.scrollTo({ left: rail.clientWidth * Number(t.dataset.thumb), behavior: 'smooth' });
      }));
      rail.addEventListener('scroll', () => {
        const idx = Math.round(rail.scrollLeft / rail.clientWidth);
        thumbs.forEach((t, n) => t.classList.toggle('is-active', n === idx));
      }, { passive: true });
    }
  });

  /* ---------- Lightbox ---------- */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      const section = trigger.closest('.shopify-section') || document;
      const dlg = $('[data-lightbox-dialog]', section);
      if (!dlg || !dlg.showModal) return;
      const img = $('[data-lightbox-img]', dlg);
      img.src = trigger.dataset.lightbox;
      img.alt = trigger.dataset.lightboxAlt || '';
      dlg.showModal();
      return;
    }
    const dlg = e.target.closest('[data-lightbox-dialog]');
    if (dlg && (e.target.closest('[data-lightbox-close]') || e.target === dlg)) dlg.close();
  });

  /* ---------- Video sound toggle ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-video-sound]');
    if (!btn) return;
    const video = btn.parentElement.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted) { video.currentTime = 0; video.play(); }
    $('[data-sound-off]', btn).hidden = !video.muted;
    $('[data-sound-on]', btn).hidden = video.muted;
    btn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
  });

  /* ---------- Lazy autoplay videos only when visible ---------- */
  const vio = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) { target.play && target.play().catch(() => {}); }
      else { target.pause && target.pause(); }
    });
  }, { threshold: 0.25 });
  if (vio) $$('.video-story__video').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); vio.observe(v); });

  /* ---------- Scroll reveal ---------- */
  if (C.animations && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-inview'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('.anim').forEach((el) => io.observe(el));
  } else {
    $$('.anim').forEach((el) => el.classList.add('is-inview'));
  }

  /* ---------- Recover password toggle (login page) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle-recover]');
    if (!t) return;
    e.preventDefault();
    $('#recover')?.scrollIntoView({ behavior: 'smooth' });
    $('#RecoverEmail')?.focus();
  });

  /* ---------- Theme editor support ---------- */
  document.addEventListener('shopify:section:load', () => {
    $$('.anim').forEach((el) => el.classList.add('is-inview'));
  });
})();
