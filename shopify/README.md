# VYAM on Shopify

A Shopify theme that reproduces the VYAM Next.js store (same layout, colours and copy), plus a product import file.

| File | What it is |
| --- | --- |
| `vyam-theme.zip` | Upload this in Shopify (Online Store → Themes → Add theme → Upload zip file) |
| `products.csv` | The 5 SMOD products, 10 variants and 30 images (Products → Import) |
| `theme/` | Theme source (the zip is built from this) |
| `make-products-csv.mjs` | Regenerates `products.csv` from `vyam-store/lib/catalog.js` |

Rebuild the zip after editing the theme: `cd shopify/theme && rm -f ../vyam-theme.zip && zip -qr ../vyam-theme.zip .`

## Setup (in this order)

1. **Import products** — Products → Import → `products.csv`. Shopify downloads every image into its own CDN during import, so the store no longer depends on the Higgsfield links.
2. **Upload the theme** — Online Store → Themes → Add theme → Upload zip file → `vyam-theme.zip`, then Customize → check → Publish.
3. **Homepage banner** — Customize → Hero banner → upload the banner image. Until you do, it loads from the old Higgsfield URL.
4. **Menus** — Online Store → Navigation:
   - `Main menu`: Shop → `/collections/all`, Brands → `/collections`, About → page "About", Contact → page "Contact".
   - Create a `Footer company` menu (About, Contact) and select it in Customize → Footer.
5. **Pages** — Online Store → Pages:
   - "About" → template `page.about`
   - "Contact" → template `page.contact` (enquiries arrive at the store email)
6. **Policies** — Settings → Policies. Fill in Privacy, Refund, Shipping and Terms; they appear in the footer automatically. The old site's policy text mentions Razorpay, Shiprocket and browser storage — update it for Shopify before reusing it.
7. **Payments & shipping** — Settings → Payments: add Razorpay (or another Indian gateway). Shipping: install the Shiprocket app if you keep Shiprocket. Shopify's own checkout replaces the old Razorpay/Supabase/Shiprocket code, so none of that is needed here.
8. **Money format** (optional) — Settings → General → Store currency → Change formatting → `₹{{amount_no_decimals}}` so prices read ₹499 instead of ₹499.00 everywhere, including checkout.

## How the theme maps the old site

| Old site | Shopify |
| --- | --- |
| `/shop` | `/collections/all` (brand filter chips appear once there is more than one vendor) |
| `/brands` | `/collections` |
| `/brand/smod` | `/collections/vendors?q=SMOD` — brand hero + story; brands with no products show "launching soon" |
| Brand colours & copy | `theme/snippets/brand.liquid` (one line per brand, keyed by product **Vendor**) |
| Per-variant image sets | Each image's **alt text** = variant name (e.g. "20 Pods"); the gallery shows the matching images |
| "₹24.95 per wash" | Calculated from the variant name ("20 Pods" → price ÷ 20) |

When a new brand launches, add its products with **Vendor** set exactly to the brand name (e.g. `FYND`) and change `soon` to `live` for it in `snippets/brand.liquid`.

## Not carried over

- Coming-soon placeholder products — the brand cards and brand pages already say "Coming soon", and empty product tiles made the shop look unfinished.
