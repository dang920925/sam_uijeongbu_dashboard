import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, ImageIcon } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { useUploadImage } from '@/hooks/useUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Gallery } from '@/types'

const CATEGORIES = ['공연', '연습', '이벤트', '단체사진', '기타']

export default function GalleryPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [uploadCategory, setUploadCategory] = useState(CATEGORIES[0])
  const [uploadDescription, setUploadDescription] = useState('')

  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ['galleries', selectedCategory],
    queryFn: async () => {
      const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''
      const res = await axiosInstance.get<Gallery[]>(`/galleries${params}`)
      return res.data
    },
  })

  const uploadImage = useUploadImage()

  const createGalleryMutation = useMutation({
    mutationFn: async ({ imageUrl, category, description }: { imageUrl: string; category?: string; description?: string }) => {
      const res = await axiosInstance.post<Gallery>('/galleries', { imageUrl, category, description })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
      setUploadDescription('')
    },
  })

  const deleteGalleryMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/galleries/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { url } = await uploadImage.mutateAsync(file)
      await createGalleryMutation.mutateAsync({
        imageUrl: url,
        category: uploadCategory,
        description: uploadDescription || undefined,
      })
    } catch (error) {
      console.error('Upload failed:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isUploading = uploadImage.isPending || createGalleryMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">갤러리</h2>
          <p className="text-sm text-slate-500 mt-1">공연 및 활동 사진을 관리합니다</p>
        </div>
      </div>

      {/* 업로드 영역 */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">이미지 업로드</h3>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1.5">
            <Label className="text-xs">카테고리</Label>
            <Select
              className="w-32"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-40">
            <Label className="text-xs">설명 (선택)</Label>
            <Input
              placeholder="사진 설명 입력"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? '업로드 중...' : '이미지 선택'}
            </Button>
          </div>
        </div>
        {(uploadImage.isError || createGalleryMutation.isError) && (
          <p className="text-xs text-red-500 mt-2">업로드 중 오류가 발생했습니다</p>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setSelectedCategory('')}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 이미지 그리드 */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
      ) : galleries.length === 0 ? (
        <div className="py-16 text-center">
          <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">등록된 이미지가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {galleries.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100">
              <img
                src={item.imageUrl}
                alt={item.description || item.category || '갤러리 이미지'}
                className="w-full h-full object-cover"
              />
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {item.category && (
                  <span className="text-xs text-white bg-black/40 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                )}
                {item.description && (
                  <p className="text-xs text-white text-center line-clamp-2">{item.description}</p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-1"
                  onClick={() => {
                    if (confirm('이미지를 삭제하시겠습니까?')) {
                      deleteGalleryMutation.mutate(item.id)
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
