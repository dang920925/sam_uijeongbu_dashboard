import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '@/lib/axios'
import type { LoginRequest, LoginResponse } from '@/types'

export function useLogin() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      navigate('/')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()

  return () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }
}

export function useIsAuthenticated() {
  return !!localStorage.getItem('access_token')
}
