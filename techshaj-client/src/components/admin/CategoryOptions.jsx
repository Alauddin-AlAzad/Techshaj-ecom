const label = (c) => (c.active === false ? `${c.name} (hidden)` : c.name)

// <option>s for a category select: each parent with its subcategories grouped under it.
// leafOnly: a parent with subcategories is only a group label (unless it is `current`).
export default function CategoryOptions({ tree, leafOnly = false, current }) {
  return tree.map((parent) =>
    parent.children.length ? (
      <optgroup key={parent.id} label={label(parent)}>
        {(!leafOnly || String(parent.id) === String(current)) && <option value={parent.id}>{label(parent)} (all)</option>}
        {parent.children.map((c) => (
          <option key={c.id} value={c.id}>
            {label(c)}
          </option>
        ))}
      </optgroup>
    ) : (
      <option key={parent.id} value={parent.id}>
        {label(parent)}
      </option>
    ),
  )
}
