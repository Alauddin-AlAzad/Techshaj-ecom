import { CircleCheck, Send } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useAdminMeta, useSaveSettings, useSendMetaTest } from '../../hooks/useAdminSettings.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'
import { Skeleton } from '../Skeleton.jsx'
import Button from './Button.jsx'
import Card from './Card.jsx'
import ErrorState from './ErrorState.jsx'
import FormField from './FormField.jsx'
import Toggle from './Toggle.jsx'
import { inputClass } from './inputClass.js'
import { SaveBar } from './TopBarSettings.jsx'

const schema = z.object({
  enabled: z.boolean(),
  pixelId: z.string().trim().regex(/^(\d{8,20})?$/, 'Pixel ID is 8 to 20 digits'),
  testEventCode: z.string().trim().regex(/^[A-Za-z0-9_-]{0,40}$/, 'Use letters, digits, - and _ only'),
  capiToken: z.string().trim().regex(/^(\S{20,})?$/, 'This token looks too short'),
  removeToken: z.boolean(),
})

const toForm = (meta) => ({ enabled: meta.enabled, pixelId: meta.pixelId, testEventCode: meta.testEventCode, capiToken: '', removeToken: false })

function Form({ meta, onDirtyChange }) {
  const defaults = useMemo(() => toForm(meta), [meta])
  const form = useForm({ resolver: zodResolver(schema), defaultValues: defaults })
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = form
  const [enabled, capiToken, removeToken] = useWatch({ control, name: ['enabled', 'capiToken', 'removeToken'] })
  const save = useSaveSettings()
  const test = useSendMetaTest()

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])
  useEffect(() => reset(defaults), [defaults, reset])

  const hasToken = (meta.hasToken && !removeToken) || Boolean(capiToken.trim())

  const onSubmit = (values) => {
    const payload = { pixelId: values.pixelId.trim(), enabled: values.enabled, testEventCode: values.testEventCode.trim() }
    if (values.capiToken.trim()) payload.capiToken = values.capiToken.trim()
    else if (values.removeToken) payload.capiToken = ''
    save.mutate(
      { meta: payload },
      {
        onSuccess: () => notify.success('Tracking saved', { description: values.enabled ? 'The Pixel loads on every page now.' : 'Tracking is switched off.' }),
        onError: (error) => notify.error('Could not save tracking', { description: errorMessage(error) }),
      },
    )
  }

  const sendTest = () =>
    test.mutate(undefined, {
      onSuccess: (r) => notify.success('Test event sent', { description: `Meta received ${r.eventsReceived} event. Open Test events in Events Manager to see it.` }),
      onError: (error) => notify.error('Test failed', { description: errorMessage(error) }),
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Card title="Meta Pixel" subtitle="Tracks visits, add to cart, checkout and orders in the browser, and sends orders from the server too.">
        <Toggle checked={enabled} onChange={(v) => setValue('enabled', v, { shouldDirty: true })} label={enabled ? 'Tracking is on' : 'Tracking is off'} />
        <FormField label="Pixel ID" htmlFor="meta-pixel" error={errors.pixelId?.message} hint="Events Manager > your Pixel (Dataset) > Settings. It is a number.">
          <input id="meta-pixel" inputMode="numeric" placeholder="e.g. 123456789012345" aria-invalid={Boolean(errors.pixelId)} className={inputClass(errors.pixelId)} {...register('pixelId')} />
        </FormField>
      </Card>

      <Card title="Server tracking (Conversions API)" subtitle="Optional but recommended. Orders are sent from the server, so ad blockers and iPhone privacy settings cannot hide them.">
        <FormField
          label="Access token"
          htmlFor="meta-token"
          error={errors.capiToken?.message}
          hint="Events Manager > Settings > Conversions API > Generate access token. It is saved on the server and never shown here again."
        >
          <input
            id="meta-token"
            type="password"
            autoComplete="new-password"
            placeholder={meta.hasToken && !removeToken ? `Saved, ends with ${meta.tokenHint}. Paste a new one to replace it` : 'Paste the access token'}
            aria-invalid={Boolean(errors.capiToken)}
            className={inputClass(errors.capiToken)}
            {...register('capiToken')}
          />
        </FormField>
        <div className="flex items-center gap-3 text-body-sm">
          {hasToken ? (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CircleCheck size={15} />
              Server tracking is ready
            </span>
          ) : (
            <span className="text-text-muted">No token yet, so only browser events are sent.</span>
          )}
          {meta.hasToken && !capiToken && (
            <button type="button" onClick={() => setValue('removeToken', !removeToken, { shouldDirty: true })} className="font-semibold text-error hover:underline">
              {removeToken ? 'Keep the saved token' : 'Remove saved token'}
            </button>
          )}
        </div>
      </Card>

      <Card title="Test" subtitle="Use this to check the setup before running ads.">
        <FormField label="Test event code" htmlFor="meta-test" error={errors.testEventCode?.message} hint="Events Manager > Test events > shows a code like TEST12345. Clear it after testing, because while it is set, real orders are sent as test events.">
          <input id="meta-test" placeholder="TEST12345" aria-invalid={Boolean(errors.testEventCode)} className={inputClass(errors.testEventCode)} {...register('testEventCode')} />
        </FormField>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" Icon={Send} loading={test.isPending} disabled={isDirty} onClick={sendTest}>
            Send test event
          </Button>
          {isDirty && <p className="text-body-sm text-text-muted">Save your changes first.</p>}
        </div>
      </Card>

      <SaveBar dirty={isDirty} saving={save.isPending} onCancel={() => reset(defaults)} label="Save tracking" />
    </form>
  )
}

// Settings > Tracking: Meta Pixel and Conversions API.
export default function MetaPixelSettings({ onDirtyChange }) {
  const { data, isLoading, error, refetch } = useAdminMeta()
  if (isLoading) return <Skeleton className="h-[360px] rounded-xl" />
  if (error || !data) {
    return (
      <div className="rounded-xl border border-border bg-white">
        <ErrorState title="Could not load tracking settings" onRetry={refetch} />
      </div>
    )
  }
  return <Form meta={data} onDirtyChange={onDirtyChange} />
}
