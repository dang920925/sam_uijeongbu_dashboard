import { useMutation } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import type { UploadResponse } from '@/types'

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await axiosInstance.post<UploadResponse>('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
  })
}
