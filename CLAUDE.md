# TechShaj

- `techshaj-client/` — the storefront (Vite + React).
- `techshaj-server/` — backend (not set up yet).

## Rules

- **Stack:** Vite, React, Tailwind CSS v4, react-router-dom, lucide-react, swiper, zustand, react-hook-form, zod, sonner, clsx, tailwind-merge. Use react-icons only for brand logos (WhatsApp, Messenger, Facebook); all other icons come from lucide-react. Ask before adding any other library.
- **Design source:** Figma file `Tclus1mqiyvGPKNPAy44vQ`. Match Figma spacing, colors and fonts exactly. Read the node with the Figma MCP before building a screen.
- **Colors:** use only Tailwind theme tokens. No raw hex values in components.
- **Data:** all data comes from `src/data/fakeData.json` for now. No hardcoded product data inside components.
- **Language:** code, strings and comments in English. Bangla appears only where the Figma design shows Bangla text. Keep comments minimal.
- **Responsive:** mobile first. Check every page at 390px and 1440px.
- **Scope:** do not change files that are not part of the current task.

## Structure (`techshaj-client/src`)

- `components/` — shared UI; `components/layout/` — `Layout` (header + `<Outlet />`) and other page-frame pieces.
- `pages/` — one file per route; routes are defined in `App.jsx`.
- `data/fakeData.json` — the only data source.
- `context/` — zustand stores and React context.
- `hooks/` — custom hooks.
- `assets/` — images downloaded from Figma.
- `lib/cn.js` — `cn()` = clsx + tailwind-merge, configured for the custom tokens. Use it for conditional or merged class names.

## Design tokens

Defined in `techshaj-client/src/index.css` (from Figma frame `86:20441`).

- Colors: `primary`, `primary-soft`, `primary-tint`, `secondary`, `secondary-tint`, `highlight`, `highlight-tint`, `dark`, `text`, `text-secondary`, `text-muted`, `text-faint`, `border`, `border-strong`, `surface`, `white`, `success`, `success-tint`, `error`, `error-tint` (e.g. `bg-primary`, `text-text-muted`, `border-border-strong`).
- Fonts: `font-heading` (Montserrat), `font-body` (Inter, default), `font-bangla` (Hind Siliguri).
- Type scale: `text-h1`–`text-h4`, `text-body-lg`, `text-body`, `text-body-sm`, `text-label`, `text-label-sm`, `text-price-lg`, `text-price`. Each sets the size and the Figma weight.
- `bg-brand-gradient`: only for final purchase buttons (Order Now, Checkout, অর্ডার কনফার্ম করুন).
