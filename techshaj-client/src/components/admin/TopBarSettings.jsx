import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useSaveSettings } from '../../hooks/useAdminSettings.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { TOP_BAR_SPEEDS, freeDeliveryMessage, topBarOf } from '../../lib/topBar.js'
import { zodResolver } from '../../lib/zodResolver.js'
import Button from './Button.jsx'
import Card from './Card.jsx'
import FormField from './FormField.jsx'
import Toggle from './Toggle.jsx'
import { inputClass } from './inputClass.js'

const MAX_LEFT = 2
const MAX_RIGHT = 3

const link = z
  .string()
  .trim()
  .refine((v) => !v || /^\/\S*$/.test(v) || /^https?:\/\/\S+$/.test(v) || /^(tel|mailto):\S+$/.test(v), 'Use /path, https://…, tel: or mailto:')

const schema = z.object({
  enabled: z.boolean(),
  speed: z.enum(TOP_BAR_SPEEDS.map((s) => s.value)),
  messages: z.array(z.object({ text: z.string().trim().min(1, 'Enter the message').max(120, 'Keep it under 120 characters'), link })),
  left: z.array(z.object({ label: z.string().trim().min(1, 'Enter a label').max(40, 'Keep it short'), href: link })).max(MAX_LEFT),
  right: z.array(z.object({ label: z.string().trim().min(1, 'Enter a label').max(40, 'Keep it short'), href: link })).max(MAX_RIGHT),
})

const toForm = (settings) => {
  const t = topBarOf(settings)
  return {
    enabled: t.enabled !== false,
    speed: TOP_BAR_SPEEDS.some((s) => s.value === t.speed) ? t.speed : 'normal',
    messages: (t.messages ?? []).map((m) => ({ text: m.text ?? '', link: m.link ?? '' })),
    left: (t.left ?? []).map((i) => ({ label: i.label ?? '', href: i.href ?? '' })),
    right: (t.right ?? []).map((i) => ({ label: i.label ?? '', href: i.href ?? '' })),
  }
}

const smallButton = 'flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:border-text-faint hover:text-text disabled:opacity-40 md:size-10'

function ItemList({ form, name, textKey, linkKey, textLabel, linkLabel, linkPlaceholder, max, reorder = false, addLabel }) {
  const { control, register, formState } = form
  const { fields, append, remove, move } = useFieldArray({ control, name })
  const errorOf = (i, key) => formState.errors[name]?.[i]?.[key]?.message

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && <p className="text-body-sm text-text-muted">Nothing added yet.</p>}
      <ul className="flex flex-col gap-3">
        {fields.map((field, i) => (
          <li key={field.id} className="flex flex-col gap-2.5 rounded-lg border border-border p-3 md:flex-row md:items-start">
            <FormField error={errorOf(i, textKey)} className="min-w-0 md:flex-[1.4]">
              <input aria-label={`${textLabel} ${i + 1}`} placeholder={textLabel} aria-invalid={Boolean(errorOf(i, textKey))} className={cn(inputClass(errorOf(i, textKey)), 'h-11')} {...register(`${name}.${i}.${textKey}`)} />
            </FormField>
            <FormField error={errorOf(i, linkKey)} className="min-w-0 md:flex-1">
              <input aria-label={`${linkLabel} ${i + 1}`} placeholder={linkPlaceholder} aria-invalid={Boolean(errorOf(i, linkKey))} className={cn(inputClass(errorOf(i, linkKey)), 'h-11')} {...register(`${name}.${i}.${linkKey}`)} />
            </FormField>
            <div className="flex gap-2">
              {reorder && (
                <>
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${i + 1} up`} className={smallButton}>
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === fields.length - 1} aria-label={`Move ${i + 1} down`} className={smallButton}>
                    <ArrowDown size={16} />
                  </button>
                </>
              )}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${i + 1}`} className={cn(smallButton, 'ml-auto text-error hover:border-error hover:text-error md:ml-0')}>
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {(!max || fields.length < max) && (
        <Button variant="secondary" Icon={Plus} onClick={() => append({ [textKey]: '', [linkKey]: '' })} className="self-start">
          {addLabel}
        </Button>
      )}
    </div>
  )
}

// Settings > Top bar: the bar above the navbar on every page.
export default function TopBarSettings({ settings, onDirtyChange }) {
  const defaults = useMemo(() => toForm(settings), [settings])
  const form = useForm({ resolver: zodResolver(schema), defaultValues: defaults })
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form
  const [enabled, messages] = useWatch({ control, name: ['enabled', 'messages'] })
  const save = useSaveSettings()
  const auto = freeDeliveryMessage(settings.freeShippingThreshold)

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const onSubmit = (values) => {
    const topBar = {
      enabled: values.enabled,
      speed: values.speed,
      messages: values.messages.map((m) => ({ text: m.text.trim(), link: m.link.trim() })),
      left: values.left.map((i) => ({ label: i.label.trim(), href: i.href.trim() })),
      right: values.right.map((i) => ({ label: i.label.trim(), href: i.href.trim() })),
    }
    save.mutate(
      { topBar },
      {
        onSuccess: () => {
          notify.success('Top bar saved', { description: 'Every page shows the new top bar now.' })
          reset(values)
        },
        onError: (error) => notify.error('Could not save the top bar', { description: errorMessage(error) }),
      },
    )
  }

  const preview = [auto, ...(messages ?? []).map((m) => m.text.trim())].filter(Boolean)

  return (
    <form onSubmit={handleSubmit(onSubmit, () => notify.error('Please fix the highlighted fields'))} noValidate className="flex flex-col gap-4">
      <p className="text-[13px] text-text-muted">The thin pink bar above the navbar. The middle scrolls, the side items stay put (side items show on desktop).</p>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card title="Display">
          <Controller control={control} name="enabled" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Show the top bar" />} />
          <FormField label="Scrolling speed">
            <Controller
              control={control}
              name="speed"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Scrolling speed" className="grid grid-cols-3 gap-2">
                  {TOP_BAR_SPEEDS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      role="radio"
                      aria-checked={field.value === s.value}
                      onClick={() => field.onChange(s.value)}
                      className={cn(
                        'h-11 rounded-lg border text-[13px] font-semibold',
                        field.value === s.value ? 'border-primary bg-primary-tint text-primary' : 'border-border-strong text-text-secondary hover:border-text-faint',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </FormField>
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-semibold text-text">Preview</p>
            <div className={cn('overflow-hidden rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold whitespace-nowrap text-white', !enabled && 'opacity-40')}>
              {preview.length ? preview.join('   •   ') : 'No messages'}
            </div>
          </div>
        </Card>

        <Card title="Scrolling messages" subtitle="Shown in this order after the free delivery message.">
          <div className="rounded-lg bg-fill-soft px-3 py-2.5 text-body-sm text-text-secondary">
            {auto ? (
              <>
                First message (automatic): <span className="font-semibold text-text">{auto}</span>. Change the amount on the Delivery tab.
              </>
            ) : (
              'No free delivery message: the free delivery amount on the Delivery tab is empty or 0.'
            )}
          </div>
          <ItemList form={form} name="messages" textKey="text" linkKey="link" textLabel="Message" linkLabel="Message link" linkPlaceholder="Link (optional), e.g. /offers" reorder addLabel="Add message" />
        </Card>

        <Card title="Left items" subtitle={`Up to ${MAX_LEFT}. They never scroll.`}>
          <ItemList form={form} name="left" textKey="label" linkKey="href" textLabel="Label" linkLabel="Left item link" linkPlaceholder="/track-order or tel:01700000000" max={MAX_LEFT} addLabel="Add left item" />
        </Card>

        <Card title="Right items" subtitle={`Up to ${MAX_RIGHT}. They never scroll.`}>
          <ItemList form={form} name="right" textKey="label" linkKey="href" textLabel="Label" linkLabel="Right item link" linkPlaceholder="/contact or tel:01700000000" max={MAX_RIGHT} addLabel="Add right item" />
        </Card>
      </div>

      <SaveBar dirty={isDirty} saving={save.isPending} onCancel={() => reset()} label="Save top bar" />
    </form>
  )
}

// Sticky bottom bar with Cancel and Save, shared by the settings tabs.
export function SaveBar({ dirty, saving, onCancel, label = 'Save changes' }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-10 flex items-center justify-end gap-2.5 border-t border-border bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:-mx-7 lg:px-7">
      <p className="mr-auto text-body-sm text-text-muted max-sm:hidden">{dirty ? 'You have unsaved changes' : 'No changes yet'}</p>
      <Button variant="secondary" onClick={onCancel} disabled={!dirty || saving} className="max-sm:flex-1">
        Cancel
      </Button>
      <Button type="submit" Icon={Save} loading={saving} disabled={!dirty} className="max-sm:flex-1">
        {label}
      </Button>
    </div>
  )
}
