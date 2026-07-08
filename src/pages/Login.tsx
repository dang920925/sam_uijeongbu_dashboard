import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router-dom'
import { useLogin, useIsAuthenticated } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const isAuthenticated = useIsAuthenticated()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = (data: LoginForm) => {
    login.mutate(data)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">SAM 의정부</h1>
          <p className="text-sm text-slate-500 mt-1">관리자 로그인</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username"
              placeholder="아이디 입력"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호 입력"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {login.isError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              아이디 또는 비밀번호가 올바르지 않습니다.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={login.isPending}
          >
            로그인
          </Button>
        </form>
      </div>
    </div>
  )
}
