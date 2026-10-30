# TechShaj

- `techshaj-client/` — the storefront (Vite + React).
- `techshaj-server/` — backend (not set up yet).

## Rules

- **Stack:** Vite, React, Tailwind CSS v4, react-router-dom, lucide-react, swiper, zustand, react-hook-form, zod, sonner, clsx, tailwind-merge. Use react-icons only for brand logos (WhatsApp, Messenger, Facebook); all other icons come from lucide-react. Ask before adding any other library.
- **Design source:** Figma file `Tclus1mqiyvGPKNPAy44vQ`. Match Figma spacing, colors and fonts exactly. Read the node with the Figma MCP before building a screen.
- **Colors:** use only Tailwind theme tokens. No raw hex values in components.
- **Data:** all data comes from `src/data/fakeData.json` for now, read through the async helpers in `src/data/api.js`. No hardcoded product data inside components.
- **Prices:** numbers in BDT. Always display with `formatPrice()` from `src/lib/format.js` (e.g. `৳1,590`).
- **Ratings:** show only when `reviewCount >= 3` (`shouldShowRating()`). New products have `rating` and `soldCount` of 0.
- **Language:** code, strings and comments in English. Bangla appears only where the Figma design shows Bangla text. Keep comments minimal.
- **Responsive:** mobile first. Check every page at 390px and 1440px.
- **Scope:** do not change files that are not part of the current task.

## Structure (`techshaj-client/src`)

- `components/` — shared UI. Always use `ProductCard` for products (`orderOnHover` adds the Shop grid hover state).
  - `layout/` — `Layout` wraps every route: announcement bar, header (desktop live search, mobile full-screen search), category nav, footer, floating contact, mobile bottom nav. Desktop layout starts at `lg` (1024px). Pages set their own width with `site-container`.
  - `home/` — `SectionHeader` and `ProductRow` (Swiper rows with header arrows) are reused on other pages.
  - `shop/`, `product/`, `search/` — page-specific pieces.
- `pages/` — one file per route; routes are defined in `App.jsx`. `/category/:slug` reuses `Shop`.
- `data/fakeData.json` — the only data source; `data/api.js` — async helpers over it.
- `context/` — zustand stores (persisted to localStorage): `useCartStore`, `useFavoriteStore`, `useSearchStore`.
- `hooks/` — `useAsync(loader, deps)` for calling `data/api.js`, `useCountdown`, `useSwiperNav`, `useProductSearch`.
- `assets/` — images downloaded from Figma.
- `lib/` — `cn()` (clsx + tailwind-merge, configured for the custom tokens), `format.js`, `product.js`, `shopFilters.js`.
- Shop filters and sort live in the URL query (`q`, `cat`, `col`, `color`, `brand`, `min`, `max`, `stock`, `sort`, `page`) so listings can be shared.

## Design tokens

Defined in `techshaj-client/src/index.css` (from Figma frame `86:20441`).

- Colors: `primary`, `primary-soft`, `primary-tint`, `secondary`, `secondary-tint`, `highlight`, `highlight-tint`, `dark`, `text`, `text-secondary`, `text-muted`, `text-faint`, `border`, `border-strong`, `surface`, `white`, `success`, `success-tint`, `error`, `error-tint` (e.g. `bg-primary`, `text-text-muted`, `border-border-strong`).
- Extra colors used in Figma frames but not defined as Figma variables are also tokens (header/footer, home banners, flash sale, filters, product page). Check `@theme` in `index.css` before adding one; never write the hex in a component.
- `site-container`: 1240px content width (from the 1440px frames) with a 16px gutter. Use it for every page section.
- Fonts: `font-heading` (Montserrat), `font-body` (Inter, default), `font-bangla` (Hind Siliguri).
- Type scale: `text-h1`–`text-h4`, `text-body-lg`, `text-body`, `text-body-sm`, `text-label`, `text-label-sm`, `text-price-lg`, `text-price`. Each sets the size and the Figma weight.
- `bg-brand-gradient`: only for final purchase buttons (Order Now, Checkout, অর্ডার কনফার্ম করুন).
