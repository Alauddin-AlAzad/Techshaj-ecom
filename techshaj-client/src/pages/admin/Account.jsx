import { useMutation } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../components/admin/Button.jsx'
import FormField from '../../components/admin/FormField.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import PageHeader from '../../components/admin/PageHeader.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import { useAdmin } from '../../hooks/useAdmin.js'
import { useAxiosSecure } from '../../hooks/useAxiosSecure.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

const empty = { currentPassword: '', newPassword: '', confirmPassword: '' }

const card = 'flex flex-col gap-4 rounded-xl border border-border bg-white p-5'

export default function Account() {
  const { admin, isLoading } = useAdmin()
  const axiosSecure = useAxiosSecure()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: empty })

  const changePassword = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => (await axiosSecure.post('/admin/change-password', { currentPassword, newPassword })).data,
    onSuccess: (data) => {
      notify.success(data?.message ?? 'Password changed successfully')
      reset(empty)
    },
    onError: (error) => notify.error('Could not change password', { description: errorMessage(error) }),
  })

  const field = (name, label, autoComplete, hint) => (
    <FormField label={label} htmlFor={name} error={errors[name]?.message} hint={hint}>
      <input id={name} type="password" autoComplete={autoComplete} aria-invalid={Boolean(errors[name])} className={inputClass(errors[name])} {...register(name)} />
    </FormField>
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Account" subtitle="Your admin profile and password" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
        <section className={card}>
          <h2 className="text-h4 text-text">Profile</h2>
          <dl className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-label-sm text-text-muted">Name</dt>
              <dd className="text-body font-medium text-text">{isLoading ? <Skeleton className="h-4 w-32" /> : admin?.name || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label-sm text-text-muted">Email</dt>
              <dd className="text-body font-medium break-all text-text">{isLoading ? <Skeleton className="h-4 w-48" /> : admin?.email}</dd>
            </div>
          </dl>
        </section>

        <form onSubmit={handleSubmit((values) => changePassword.mutate(values))} noValidate className={card}>
          <h2 className="text-h4 text-text">Change password</h2>
          {field('currentPassword', 'Current password', 'current-password')}
          {field('newPassword', 'New password', 'new-password', 'At least 8 characters')}
          {field('confirmPassword', 'Confirm new password', 'new-password')}
          <Button type="submit" Icon={KeyRound} loading={changePassword.isPending} className="self-start">
            Change password
          </Button>
        </form>
      </div>
    </div>
  )
}
