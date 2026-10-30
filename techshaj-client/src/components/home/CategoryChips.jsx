import { Link } from 'react-router-dom'

// Mobile only (Home – Mobile 390, "Category Chips").
export default function CategoryChips({ categories }) {
  return (
    <nav aria-label="Categories" className="border-b border-nav-line lg:hidden">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        <li>
          <Link to="/categories" className="block rounded-2xl bg-text px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap text-white">
            All
          </Link>
        </li>
        {categories?.map((c) => (
          <li key={c.id}>
            <Link to={`/category/${c.slug}`} className="block rounded-2xl bg-fill px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap text-text-secondary">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
