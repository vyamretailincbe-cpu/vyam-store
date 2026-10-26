// Builds products.csv (Shopify product import format) from the Next.js catalog.
// Only buyable products are exported; coming-soon brands are shown through the theme's brand cards.
// Each image's alt text is set to its variant title so the theme shows the right images per variant.
// Run: node shopify/make-products-csv.mjs
import { PRODUCTS, BRANDS } from "../vyam-store/lib/catalog.js";
import { writeFileSync } from "fs";

const COLS = ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published", "Option1 Name", "Option1 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Policy", "Variant Fulfillment Service",
  "Variant Price", "Variant Requires Shipping", "Variant Taxable", "Variant Image", "Image Src", "Image Position",
  "Image Alt Text", "Status"];
const esc = (v) => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const html = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rows = [];
for (const p of PRODUCTS.filter((p) => p.buyable)) {
  const brand = BRANDS[p.brand];
  const body = `<p>${html(p.desc)}</p>` + (p.features.length ? `<ul>${p.features.map((f) => `<li>${html(f)}</li>`).join("")}</ul>` : "");
  const images = p.variants.flatMap((v) => v.images.map((src) => ({ src, alt: v.label })));
  const n = Math.max(p.variants.length, images.length);
  for (let i = 0; i < n; i++) {
    const v = p.variants[i];
    const img = images[i];
    const r = { Handle: p.slug };
    if (i === 0) {
      Object.assign(r, { Title: p.name, "Body (HTML)": body, Vendor: brand.name, Type: "Laundry Pods",
        Tags: [brand.name, ...brand.cat.split("•").map((t) => t.trim())].join(", "), Published: "TRUE",
        "Option1 Name": "Size", Status: "active" });
    }
    if (v) {
      Object.assign(r, { "Option1 Value": v.label, "Variant SKU": `${p.slug}-${parseInt(v.label, 10)}`.toUpperCase(),
        "Variant Grams": parseInt(v.label, 10) * 10, "Variant Inventory Policy": "deny",
        "Variant Fulfillment Service": "manual", "Variant Price": v.price.toFixed(2), "Variant Requires Shipping": "TRUE",
        "Variant Taxable": "TRUE", "Variant Image": v.images[0] || "" });
    }
    if (img) Object.assign(r, { "Image Src": img.src, "Image Position": i + 1, "Image Alt Text": img.alt });
    rows.push(COLS.map((c) => esc(r[c])).join(","));
  }
}
writeFileSync(new URL("./products.csv", import.meta.url), [COLS.join(","), ...rows].join("\n") + "\n");
console.log(`products.csv: ${PRODUCTS.filter((p) => p.buyable).length} products, ${rows.length} rows`);
