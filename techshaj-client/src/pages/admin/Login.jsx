import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import Logo from '../../components/Logo.jsx'
import Button from '../../components/admin/Button.jsx'
import FormField from '../../components/admin/FormField.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useAxiosPublic } from '../../hooks/useAxiosPublic.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { useBranding } from '../../hooks/useSettings.js'
import { setToken } from '../../lib/adminAuth.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

const YEAR = new Date().getFullYear()

// Only same-app admin paths are allowed as the return target.
const returnPath = (from) => (typeof from === 'string' && from.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin')

// Figma "Admin – Login" (54:7594).
export default function Login() {
  usePageTitle('Admin login')
  const { name } = useBranding()
  const axiosPublic = useAxiosPublic()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    try {
      const { data } = await axiosPublic.post('/jwt', values)
      setToken(data.token)
      queryClient.removeQueries({ queryKey: ['admin'] })
      navigate(returnPath(location.state?.from), { replace: true })
    } catch (error) {
      notify.error('Login failed', { description: errorMessage(error) })
    }
  }

  const iconInput = (error) => cn(inputClass(error), 'pl-10')

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-[44%] max-w-[640px] shrink-0 flex-col justify-between bg-dark px-16 py-[72px] lg:flex">
        <Logo size="lg" />
        <div className="flex flex-col gap-3.5">
          <span aria-hidden="true" className="h-1.5 w-[120px] rounded-[3px] bg-primary" />
          <p className="font-heading text-h1 text-white">Manage your store</p>
          <p className="max-w-[440px] text-body-lg text-on-dark">Products, categories, banners, orders and delivery settings, all in one place.</p>
        </div>
        <p className="text-body-sm text-text-muted">© {YEAR} {name}</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 rounded-2xl bg-dark px-4 py-3 lg:hidden">
          <Logo size="sm" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-[400px] flex-col gap-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-h2 text-text">Admin login</h1>
            <p className="text-body text-text-muted">Sign in to the {name} dashboard</p>
          </div>

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint" />
              <input id="email" type="email" autoComplete="username" placeholder="admin@techshaj.com" aria-invalid={Boolean(errors.email)} className={iconInput(errors.email)} {...register('email')} />
            </div>
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Lock size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                className={cn(iconInput(errors.password), 'pr-11')}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-faint hover:text-text"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </FormField>

          <Button type="submit" loading={isSubmitting} className="h-[50px] w-full rounded-[10px] text-[15px] font-bold">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
