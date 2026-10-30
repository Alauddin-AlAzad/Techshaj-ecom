import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import PageHero from '../components/info/PageHero.jsx'
import { TINTS } from '../components/info/tints.js'
import ErrorState from '../components/ErrorState.jsx'
import pages from '../data/pages.json'
import { useSettings } from '../hooks/useSettings.js'
import { cn } from '../lib/cn.js'
import { toLatinDigits } from '../lib/format.js'
import { zodResolver } from '../lib/zodResolver.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { notify } from '../lib/notify.jsx'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  phone: z.preprocess(
    (v) => toLatinDigits(String(v ?? '')).replace(/\D/g, '').replace(/^880/, '0'),
    z.string().regex(/^01\d{9}$/, 'Enter an 11-digit phone number starting with 01'),
  ),
  orderId: z.string().trim().optional(),
  message: z.string().trim().min(10, 'Please write a little more about how we can help'),
})

// 8801700000000 -> +880 1700-000000
const formatWhatsapp = (n = '') => `+${n.slice(0, 3)} ${n.slice(3, 7)}-${n.slice(7)}`

function Input({ label, error, multiline, className, ...props }) {
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-semibold text-text">{label}</span>
      <Tag
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full rounded-lg border border-border-strong px-[13px] text-[13px] text-text outline-none placeholder:text-text-faint focus:border-primary lg:px-3.5',
          multiline ? 'h-[110px] resize-none py-3 lg:h-[130px]' : 'h-11 lg:h-[46px]',
          error && 'border-error bg-error-wash',
        )}
        {...props}
      />
      {error && (
        <span role="alert" className="text-body-sm font-medium text-error">
          {error}
        </span>
      )}
    </label>
  )
}

// Figma "Contact" desktop (42:6628) and mobile (43:7279). The form only shows a toast for now.
export default function Contact() {
  usePageTitle('Contact Us')
  const { data: store, isError, refetch } = useSettings()
  const page = pages.contact
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', phone: '', orderId: '', message: '' } })

  if (!store && isError) return <ErrorState onRetry={refetch} />
  if (!store) return <div className="min-h-[60vh]" />

  const cards = [
    { Icon: Phone, tint: 'secondary', label: 'Hotline (24/7)', value: store.hotline, href: `tel:${store.hotline}` },
    { Icon: MessageCircle, tint: 'success', label: 'WhatsApp', value: formatWhatsapp(store.whatsapp), href: `https://wa.me/${store.whatsapp}` },
    { Icon: Mail, tint: 'primary', label: 'Email', value: store.email, href: `mailto:${store.email}` },
    { Icon: MapPin, tint: 'primary', label: 'Address', value: store.address },
  ]

  const onSubmit = () => {
    notify.success(page.form.success)
    reset()
  }

  return (
    <>
      <PageHero title={page.hero.title} subtitle={page.hero.subtitle} />
      <div className="site-container flex flex-col gap-3.5 pt-5 pb-7 lg:flex-row lg:items-start lg:gap-8 lg:pt-12 lg:pb-[72px]">
        <div className="flex flex-col gap-3.5 lg:w-[420px] lg:shrink-0">
          {cards.map(({ Icon, tint, label, value, href }) => {
            const Tag = href ? 'a' : 'div'
            return (
              <Tag
                key={label}
                {...(href && { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' })}
                className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 hover:border-border-strong lg:gap-3.5 lg:p-4"
              >
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full lg:size-11', TINTS[tint])}>
                  <Icon className="size-[18px] lg:size-5" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[11px] text-text-muted lg:text-body-sm">{label}</span>
                  <span className="truncate text-[14px] font-bold text-text lg:text-[15px]">{value}</span>
                </span>
              </Tag>
            )
          })}
          <p className="hidden items-center gap-2.5 rounded-xl bg-highlight-soft px-4 py-3.5 text-[13px] font-semibold text-highlight-ink lg:flex">
            <Clock size={18} className="shrink-0" />
            {page.hours}
          </p>
          <iframe
            title="Store location on Google Maps"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`}
            loading="lazy"
            className="hidden h-[180px] w-full rounded-xl border-0 bg-border lg:block"
          />
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5 lg:flex-1 lg:gap-4 lg:rounded-2xl lg:border lg:border-border lg:p-7"
        >
          <div className="flex flex-col gap-1 lg:gap-4">
            <h2 className="text-[17px] font-bold text-text lg:text-h3">{page.form.title}</h2>
            <p className="hidden text-[13px] text-text-muted lg:block">{page.form.subtitle}</p>
          </div>
          <div className="flex flex-col gap-3.5 lg:flex-row">
            <Input label="Your name" placeholder="Full name" autoComplete="name" error={errors.name?.message} className="lg:flex-1" {...register('name')} />
            <Input
              label="Phone number"
              placeholder="01XXXXXXXXX"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              className="lg:flex-1"
              {...register('phone')}
            />
          </div>
          <Input label="Order ID (optional)" placeholder="e.g. TS2610305" className="hidden lg:flex" {...register('orderId')} />
          <Input label="Message" placeholder="How can we help?" multiline error={errors.message?.message} {...register('message')} />
          <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary px-7 text-body font-bold text-white lg:h-[50px] lg:self-start">
            Send message
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </>
  )
}
