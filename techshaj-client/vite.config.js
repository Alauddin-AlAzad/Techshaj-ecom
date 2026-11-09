import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The built stylesheet blocks the first paint, which hid the loading logo on slow networks.
const nonBlockingCss = {
  name: 'non-blocking-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) =>
      html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        `<link rel="stylesheet" crossorigin href="$1" media="print" data-app-css onload="this.media='all'" onerror="this.media='all'"><noscript><link rel="stylesheet" href="$1"></noscript>`,
      ),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), nonBlockingCss],
})
