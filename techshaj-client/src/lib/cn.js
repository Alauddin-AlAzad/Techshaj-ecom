import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Register custom theme tokens so twMerge doesn't treat text-h1 as a color and drop it.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['h1', 'h2', 'h3', 'h4', 'body-lg', 'body', 'body-sm', 'label', 'label-sm', 'price-lg', 'price'],
      font: ['heading', 'body', 'bangla'],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
