/* Product photos on the seasonal backdrop: centre each transparent PNG on what's actually in it,
   so a product that sits low or to one side in its image file still lands in the middle of the frame. */
(() => {
  const SIZE = 96;
  const centre = async (img) => {
    try {
      let src = img.currentSrc || img.src;
      if (!src) return;
      src = src.replace(/([?&])width=\d+/, '$1width=' + SIZE * 2);
      if (!/[?&]width=/.test(src)) src += (src.includes('?') ? '&' : '?') + 'width=' + SIZE * 2;
      const res = await fetch(src, { mode: 'cors' });
      const bmp = await createImageBitmap(await res.blob());
      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bmp, 0, 0, SIZE, SIZE);
      const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1, clear = 0;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const a = px[(y * SIZE + x) * 4 + 3];
        if (a < 250) clear++;
        if (a > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0 || clear < SIZE * SIZE * 0.05) return; // no transparency: leave photos as they are
      // Offset from the middle, as a share of the image; contain-fit square images fill the frame
      const ratio = bmp.width / bmp.height;
      const box = img.getBoundingClientRect();
      const boxRatio = box.width / box.height || 1;
      const sx = ratio >= boxRatio ? 1 : ratio / boxRatio;
      const sy = ratio >= boxRatio ? boxRatio / ratio : 1;
      const clamp = (v) => Math.max(-0.25, Math.min(0.25, v));
      const dx = clamp(0.5 - (x0 + x1 + 1) / 2 / SIZE) * sx * 100;
      const dy = clamp(0.5 - (y0 + y1 + 1) / 2 / SIZE) * sy * 100;
      img.style.translate = `${dx.toFixed(2)}% ${dy.toFixed(2)}%`;
    } catch (e) { /* image not readable: keep it where it is */ }
  };
  document.querySelectorAll('.pdp__slide--scene .pdp__zoom img').forEach((img) => {
    if (img.complete) centre(img); else img.addEventListener('load', () => centre(img), { once: true });
  });
})();
