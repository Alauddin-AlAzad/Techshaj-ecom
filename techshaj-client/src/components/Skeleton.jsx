import { cn } from '../lib/cn.js'

// Figma "Loading Skeleton – Mobile 390" (86:15964). Desktop sizes follow the matching desktop frames.
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('skeleton rounded-md', className)} />
}

// Wraps a skeleton so screen readers hear a single "Loading" instead of empty blocks.
function Loading({ className, children }) {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className={className}>
      {children}
    </div>
  )
}

export function ProductCardSkeleton({ className }) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <Skeleton className="h-[140px] rounded-xl lg:h-[215px]" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-[110px] max-w-full rounded" />
      <Skeleton className="h-4 w-[70px] rounded" />
      <Skeleton className="h-9 w-full rounded-lg lg:hidden" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, className }) {
  return (
    <Loading className={className}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </Loading>
  )
}

function HeaderSkeleton({ titleWidth = 'w-[170px] lg:w-[260px]' }) {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className={cn('h-5 lg:h-7', titleWidth)} />
      <Skeleton className="h-3.5 w-[50px] lg:w-[90px]" />
    </div>
  )
}

// A section header with a row of cards: 2 below lg, 5 from lg, like ProductRow.
export function ProductRowSkeleton({ titleWidth }) {
  return (
    <Loading className="site-container flex flex-col gap-[18px] pt-7 lg:gap-5 lg:pt-12">
      <HeaderSkeleton titleWidth={titleWidth} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5 lg:gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <ProductCardSkeleton key={i} className={cn(i > 1 && 'max-lg:hidden')} />
        ))}
      </div>
    </Loading>
  )
}

export function HomeSkeleton() {
  return (
    <Loading className="pb-10 lg:pb-[72px]">
      <div className="no-scrollbar flex gap-2 overflow-hidden px-4 pt-4 lg:hidden">
        {['w-11', 'w-16', 'w-[72px]', 'w-[120px]'].map((w) => (
          <Skeleton key={w} className={cn('h-[30px] shrink-0 rounded-[15px]', w)} />
        ))}
      </div>
      <div className="site-container flex flex-col gap-[18px] pt-[18px] lg:flex-row lg:gap-4 lg:pt-5">
        <Skeleton className="h-[180px] rounded-2xl lg:h-[380px] lg:flex-[2]" />
        <div className="flex gap-2.5 lg:flex-1 lg:flex-col lg:gap-4">
          <Skeleton className="h-[88px] flex-1 rounded-[14px] lg:h-[182px] lg:flex-none" />
          <Skeleton className="h-[88px] flex-1 rounded-[14px] lg:h-[182px] lg:flex-none" />
        </div>
      </div>
      <div className="site-container hidden pt-5 lg:block">
        <Skeleton className="h-[62px] rounded-[10px]" />
      </div>
      <div className="site-container flex flex-col gap-[18px] pt-[18px] lg:gap-[22px] lg:pt-12">
        <HeaderSkeleton />
        <div className="flex justify-between lg:grid lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={cn('flex flex-col items-center gap-2', i > 3 && 'max-lg:hidden')}>
              <Skeleton className="size-[54px] rounded-[14px] lg:size-[76px] lg:rounded-[18px]" />
              <Skeleton className="h-2.5 w-12 rounded lg:h-3.5 lg:w-20" />
            </div>
          ))}
        </div>
      </div>
      <ProductRowSkeleton titleWidth="w-[130px] lg:w-[200px]" />
    </Loading>
  )
}

export function ProductDetailsSkeleton() {
  return (
    <Loading className="pb-10 lg:bg-surface lg:pb-[72px]">
      <div className="site-container flex h-10 items-center lg:h-[52px]">
        <Skeleton className="h-3 w-40 lg:w-64" />
      </div>
      <div className="lg:site-container">
        <section className="flex flex-col lg:grid lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:rounded-2xl lg:bg-white lg:py-8 lg:pr-10 lg:pl-8 xl:grid-cols-[72px_500px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-2.5 lg:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-[72px] rounded-lg" />
            ))}
          </div>
          <div className="site-container flex flex-col gap-2.5 lg:p-0">
            <Skeleton className="aspect-square w-full rounded-[14px]" />
            <div className="flex gap-2 lg:hidden">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="size-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="site-container flex flex-col gap-3 pt-[18px] lg:gap-4 lg:p-0">
            <Skeleton className="h-5 w-24 rounded-xl" />
            <Skeleton className="h-6 w-full lg:h-8" />
            <Skeleton className="h-6 w-3/5 lg:h-8" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-44 lg:h-9" />
            <Skeleton className="h-[72px] w-full rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-lg" />
              ))}
            </div>
            <div className="hidden gap-3 lg:flex">
              <Skeleton className="h-[52px] flex-1 rounded-[10px]" />
              <Skeleton className="h-[52px] flex-1 rounded-[10px]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-[10px]" />
              ))}
            </div>
          </div>
        </section>
        <div className="site-container pt-7 lg:mt-6 lg:rounded-2xl lg:bg-white lg:p-8">
          <div className="flex gap-6">
            {['w-20', 'w-24', 'w-20'].map((w, i) => (
              <Skeleton key={i} className={cn('h-4', w)} />
            ))}
          </div>
          <div className="flex flex-col gap-2.5 pt-5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </Loading>
  )
}

export function ShopSkeleton() {
  return (
    <div className="pb-9 lg:pb-[72px]">
      <div className="hidden h-12 bg-surface lg:block" />
      <div className="site-container flex flex-col gap-2 pt-4 lg:items-center lg:gap-[18px] lg:pt-7">
        <Skeleton className="h-3 w-32 lg:hidden" />
        <Skeleton className="h-7 w-40 lg:h-9 lg:w-56" />
        <Skeleton className="hidden h-[46px] w-full max-w-[640px] rounded-[23px] lg:block" />
      </div>
      <div className="site-container flex gap-2.5 pt-3.5 lg:hidden">
        <Skeleton className="h-[42px] flex-1 rounded-[10px]" />
        <Skeleton className="h-[42px] flex-1 rounded-[10px]" />
      </div>
      <div className="site-container flex items-start gap-6 pt-4 lg:pt-6">
        <Skeleton className="hidden h-[560px] w-[260px] shrink-0 rounded-xl lg:block" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-[18px] hidden h-9 w-full rounded-lg lg:block" />
          <ProductGridSkeleton count={8} className="grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:grid-cols-3 lg:gap-x-4 lg:gap-y-[22px] xl:grid-cols-4" />
        </div>
      </div>
    </div>
  )
}

// Fallback while a lazy route chunk loads; listing routes get their own skeleton so it doesn't change shape.
const routeSkeletons = [
  [(path) => path === '/', HomeSkeleton],
  [(path) => path.startsWith('/product/'), ProductDetailsSkeleton],
  [(path) => path === '/shop' || path.startsWith('/category/'), ShopSkeleton],
]

export function PageSkeleton({ pathname = '' }) {
  const Route = routeSkeletons.find(([match]) => match(pathname))?.[1]
  if (Route) return <Route />
  return (
    <Loading className="site-container flex min-h-[60vh] flex-col gap-4 pt-6 pb-10 lg:pt-10">
      <Skeleton className="h-7 w-48 lg:h-9 lg:w-72" />
      <Skeleton className="h-4 w-full max-w-[520px] rounded" />
      <Skeleton className="h-[180px] w-full rounded-2xl lg:h-[280px]" />
    </Loading>
  )
}
