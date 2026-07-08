import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, User, Upload, Loader2 } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Member, ActorProfile } from '@/types'

const actorSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
})

type ActorForm = z.infer<typeof actorSchema>

export default function Actors() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedActor, setSelectedActor] = useState<Member | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: actors = [], isLoading } = useQuery({
    queryKey: ['members', 'actor'],
    queryFn: async () => {
      const res = await axiosInstance.get<Member[]>('/members?type=actor')
      return res.data
    },
  })

  const { data: actorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['actor-profile', selectedActor?.id],
    queryFn: async () => {
      const res = await axiosInstance.get<ActorProfile>(`/actor-profiles/${selectedActor!.id}`)
      return res.data
    },
    enabled: !!selectedActor,
  })

  const createMutation = useMutation({
    mutationFn: async (data: ActorForm) => {
      const res = await axiosInstance.post<Member>('/members', { ...data, type: 'actor' })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'actor'] })
      setIsCreateOpen(false)
      actorReset()
    },
  })

  const upsertProfileMutation = useMutation({
    mutationFn: async (data: Partial<ActorProfile>) => {
      const res = await axiosInstance.put<ActorProfile>(`/actor-profiles/${selectedActor!.id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-profile', selectedActor?.id] })
    },
  })

  const {
    register: actorRegister,
    handleSubmit: handleActorSubmit,
    reset: actorReset,
    formState: { errors: actorErrors },
  } = useForm<ActorForm>({ resolver: zodResolver(actorSchema) })

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
  } = useForm<{ intro: string; sns_url: string }>()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedActor) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await axiosInstance.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await upsertProfileMutation.mutateAsync({ profile_image: uploadRes.data.url })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">배우 관리</h2>
          <p className="text-sm text-slate-500 mt-1">배우 회원 목록 및 프로필을 관리합니다</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          배우 추가
        </Button>
      </div>

      <div className="flex gap-6">
        {/* 배우 목록 */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
          ) : actors.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">등록된 배우가 없습니다</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actors.map((actor) => (
                  <TableRow
                    key={actor.id}
                    className={`cursor-pointer ${selectedActor?.id === actor.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedActor(actor)}
                  >
                    <TableCell>
                      <ActorAvatar memberId={actor.id} />
                    </TableCell>
                    <TableCell className="font-medium">{actor.name}</TableCell>
                    <TableCell className="text-slate-500">{actor.phone || '-'}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(actor.joined_at || actor.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* 프로필 편집 패널 */}
        {selectedActor && (
          <div className="w-80 bg-white rounded-lg border border-slate-200 p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{selectedActor.name}</h3>
              <button onClick={() => setSelectedActor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center mb-2 border border-slate-200">
                {actorProfile?.profile_image ? (
                  <img
                    src={actorProfile.profile_image}
                    alt={selectedActor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                {uploadingImage ? '업로드 중...' : '이미지 변경'}
              </Button>
            </div>

            {profileLoading ? (
              <div className="text-sm text-slate-400 text-center py-4">로딩 중...</div>
            ) : (
              <form
                onSubmit={handleProfileSubmit((data) => upsertProfileMutation.mutate(data))}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">소개</Label>
                  <Textarea
                    rows={3}
                    placeholder="배우 소개"
                    defaultValue={actorProfile?.intro || ''}
                    {...profileRegister('intro')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SNS URL</Label>
                  <Input
                    placeholder="https://instagram.com/..."
                    defaultValue={actorProfile?.sns_url || ''}
                    {...profileRegister('sns_url')}
                  />
                </div>
                {upsertProfileMutation.isSuccess && (
                  <p className="text-xs text-green-600">저장되었습니다 ✓</p>
                )}
                <Button type="submit" className="w-full" size="sm" loading={upsertProfileMutation.isPending}>
                  저장
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 배우 추가 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>배우 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActorSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input placeholder="이름 입력" {...actorRegister('name')} />
              {actorErrors.name && <p className="text-xs text-red-500">{actorErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input placeholder="010-0000-0000" {...actorRegister('phone')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>취소</Button>
              <Button type="submit" loading={createMutation.isPending}>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 목록에서 프로필 썸네일 표시용 컴포넌트
function ActorAvatar({ memberId }: { memberId: string }) {
  const { data: profile } = useQuery({
    queryKey: ['actor-profile', memberId],
    queryFn: async () => {
      const res = await axiosInstance.get<ActorProfile>(`/actor-profiles/${memberId}`)
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
      {profile?.profile_image ? (
        <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
      ) : (
        <User className="w-4 h-4 text-slate-400" />
      )}
    </div>
  )
}
