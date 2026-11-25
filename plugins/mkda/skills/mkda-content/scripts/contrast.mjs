// Contrast of a text colour against the real pixels behind it. Runs in the page.
export async function worstContrast(page, png, color) {
  return page.evaluate(
    async ({ b64, color }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      // any CSS colour, color-mix included, goes through the canvas to sRGB
      g.clearRect(0, 0, 1, 1);
      g.fillStyle = color;
      g.fillRect(0, 0, 1, 1);
      const p = g.getImageData(0, 0, 1, 1).data;
      const L = lum(p[0], p[1], p[2]);
      const all = [];
      for (let k = 0; k < d.length; k += 4 * 13) {
        const l = lum(d[k], d[k + 1], d[k + 2]);
        all.push((Math.max(l, L) + 0.05) / (Math.min(l, L) + 0.05));
      }
      all.sort((a, b) => a - b);
      return all[Math.floor(all.length * 0.05)] ?? 21;
    },
    { b64: png.toString("base64"), color },
  );
}
