import { BatteryCharging, Headphones, Lamp, Snowflake } from 'lucide-react'
import PageHero from '../components/info/PageHero.jsx'
import { TINTS } from '../components/info/tints.js'
import { getPage } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { cn } from '../lib/cn.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const ICONS = { 'battery-charging': BatteryCharging, headphones: Headphones, lamp: Lamp, snowflake: Snowflake }

// Figma "Blog" desktop (42:7274) and mobile (43:7636).
export default function Blog() {
  usePageTitle('Blog')
  const page = useAsync(() => getPage('blog'))
  if (!page) return <div className="min-h-[60vh]" />

  return (
    <>
      <PageHero title={page.hero.title} subtitle={page.hero.subtitle} />
      <ul className="site-container grid gap-6 pt-5 pb-7 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-8 lg:pt-12 lg:pb-[72px]">
        {page.posts.map((post) => {
          const Icon = ICONS[post.icon]
          return (
            <li key={post.title}>
              <article className="flex flex-col gap-2.5 lg:gap-3">
                <div className={cn('flex h-[190px] items-center justify-center rounded-[14px] lg:h-[230px]', TINTS[post.tint])}>
                  <Icon className="size-16 text-text lg:size-20" strokeWidth={1.25} />
                </div>
                <p className="text-[11px] font-bold tracking-[0.88px] text-primary">{post.category}</p>
                <h2 className="text-[17px] leading-[23px] font-bold tracking-[-0.255px] text-text lg:text-[19px] lg:leading-[25px] lg:tracking-[-0.285px]">{post.title}</h2>
                <p className="flex items-center gap-1.5 text-body-sm text-text-faint">
                  {post.date}
                  <span className="text-on-dark">•</span>
                  {post.readTime}
                </p>
              </article>
            </li>
          )
        })}
      </ul>
    </>
  )
}
