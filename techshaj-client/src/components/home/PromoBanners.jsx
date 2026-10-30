import BannerImage from './BannerImage.jsx'

// Desktop only; the mobile Home frame has no promo row.
export default function PromoBanners({ promos }) {
  if (!promos?.length) return null

  return (
    <section className="site-container hidden gap-4 pt-12 lg:flex">
      {promos.map((p) => (
        <BannerImage key={p.id ?? p._id} banner={p} className="aspect-[4/1] min-w-0 flex-1 rounded-[14px]" />
      ))}
    </section>
  )
}
