export const STOCK_MODES = [
  { value: 'set', label: 'Set exact' },
  { value: 'add', label: 'Add' },
  { value: 'remove', label: 'Remove' },
]

// New stock from the current one, never below 0.
export function nextStock(current, mode, amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0))
  if (mode === 'set') return n
  if (mode === 'add') return current + n
  return Math.max(0, current - n)
}
