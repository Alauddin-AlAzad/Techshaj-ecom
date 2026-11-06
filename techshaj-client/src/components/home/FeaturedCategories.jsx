import { Link } from 'react-router-dom'
import CategoryIcon from '../CategoryIcon.jsx'
import SectionHeader from './SectionHeader.jsx'

export default function FeaturedCategories({ categories }) {
  if (!categories?.length) return null

  return (
    <section className="site-container pt-[26px] lg:pt-12">
      <SectionHeader title="Featured Categories" seeAllTo="/categories" seeAllLabel="See all categories" mobileSeeAllLabel="See all" />
      <ul className="mt-3.5 grid grid-cols-4 gap-y-3.5 lg:mt-[22px] lg:grid-cols-6 lg:gap-y-6">
        {categories.map((c) => (
          <li key={c.id}>
            <Link to={`/category/${c.slug}`} className="group flex flex-col items-center gap-1.5 text-center lg:gap-2.5">
              <span className="flex size-[54px] items-center justify-center overflow-hidden rounded-[14px] bg-fill text-text-secondary transition duration-300 ease-out group-hover:bg-primary-tint group-hover:text-primary lg:size-[76px] lg:rounded-[18px] lg:motion-safe:group-hover:-translate-y-1.5 lg:group-hover:shadow-menu">
                <span className="flex size-full items-center justify-center transition-transform duration-300 ease-out lg:motion-safe:group-hover:scale-110">
                  <CategoryIcon name={c.icon} image={c.image} absoluteStrokeWidth className="size-[26px] lg:size-9" />
                </span>
              </span>
              <span className="text-[11px] font-medium text-text-secondary transition-colors lg:text-[14px] lg:group-hover:text-primary">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
