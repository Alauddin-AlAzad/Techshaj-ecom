// <option>s for a category select: each parent with its subcategories grouped under it.
export default function CategoryOptions({ tree }) {
  return tree.map((parent) =>
    parent.children.length ? (
      <optgroup key={parent.id} label={parent.name}>
        <option value={parent.id}>{parent.name} (all)</option>
        {parent.children.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </optgroup>
    ) : (
      <option key={parent.id} value={parent.id}>
        {parent.name}
      </option>
    ),
  )
}
