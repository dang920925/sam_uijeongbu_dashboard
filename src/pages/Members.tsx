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
import { Badge } from '@/components/ui/badge'
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

const memberSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().optional(),
  type: z.enum(['general', 'actor']),
})

type MemberForm = z.infer<typeof memberSchema>

type TypeFilter = 'all' | 'actor' | 'general'

export default function Members() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', typeFilter],
    queryFn: async () => {
      const params = typeFilter !== 'all' ? `?type=${typeFilter}` : ''
      const res = await axiosInstance.get<Member[]>(`/members${params}`)
      return res.data
    },
  })

  const { data: actorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['actor-profile', selectedMember?.id],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<ActorProfile>(`/actor-profiles/${selectedMember!.id}`)
        return res.data
      } catch {
        return null
      }
    },
    enabled: !!selectedMember && selectedMember.type === 'actor',
  })

  const createMutation = useMutation({
    mutationFn: async (data: MemberForm) => {
      const res = await axiosInstance.post<Member>('/members', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setIsCreateOpen(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.delete(`/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setSelectedMember(null)
    },
  })

  const upsertProfileMutation = useMutation({
    mutationFn: async (data: Partial<ActorProfile>) => {
      const res = await axiosInstance.put<ActorProfile>(
        `/actor-profiles/${selectedMember!.id}`,
        data
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actor-profile', selectedMember?.id] })
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { type: 'general' },
  })

  const { register: profileRegister, handleSubmit: handleProfileSubmit } =
    useForm<{ intro: string; snsUrl: string }>()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedMember) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await axiosInstance.post<{ url: string }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await upsertProfileMutation.mutateAsync({ profileImage: uploadRes.data.url })
    } finally {
      setUploadingImage(false)
    }
  }

  const filterButtons: { label: string; value: TypeFilter }[] = [
    { label: '전체', value: 'all' },
    { label: '배우', value: 'actor' },
    { label: '일반', value: 'general' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">단원 관리</h2>
          <p className="text-sm text-slate-500 mt-1">배우 및 일반 단원을 통합 관리합니다</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          단원 추가
        </Button>
      </div>

      {/* 타입 필터 */}
      <div className="flex gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => { setTypeFilter(btn.value); setSelectedMember(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeFilter === btn.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* 목록 */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">등록된 단원이 없습니다</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className={`cursor-pointer ${selectedMember?.id === member.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <TableCell>
                      {member.type === 'actor' ? (
                        <MemberAvatar memberId={member.id} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant={member.type === 'actor' ? 'default' : 'secondary'}>
                        {member.type === 'actor' ? '배우' : '일반'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{member.phone || '-'}</TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(member.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* 상세 패널 */}
        {selectedMember && (
          <div className="w-80 bg-white rounded-lg border border-slate-200 p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 배우인 경우 프로필 이미지 + 프로필 편집 */}
            {selectedMember.type === 'actor' && (
              <>
                <div className="flex flex-col items-center mb-5">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center mb-2 border border-slate-200">
                    {actorProfile?.profileImage ? (
                      <img
                        src={actorProfile.profileImage}
                        alt={selectedMember.name}
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
                    {uploadingImage
                      ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />업로드 중...</>
                      : <><Upload className="h-3 w-3 mr-1" />이미지 변경</>
                    }
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
                        defaultValue={actorProfile?.snsUrl || ''}
                        {...profileRegister('snsUrl')}
                      />
                    </div>
                    {upsertProfileMutation.isSuccess && (
                      <p className="text-xs text-green-600">저장되었습니다 ✓</p>
                    )}
                    <Button type="submit" className="w-full" size="sm" loading={upsertProfileMutation.isPending}>
                      프로필 저장
                    </Button>
                  </form>
                )}
              </>
            )}

            {/* 일반 멤버 */}
            {selectedMember.type === 'general' && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">연락처</span>
                  <span>{selectedMember.phone || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">가입일</span>
                  <span>{formatDate(selectedMember.createdAt)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (confirm(`${selectedMember.name}을(를) 삭제하시겠습니까?`))
                  deleteMutation.mutate(selectedMember.id)
              }}
              className="mt-4 w-full text-xs text-red-400 hover:text-red-600 text-center"
            >
              단원 삭제
            </button>
          </div>
        )}
      </div>

      {/* 단원 추가 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>단원 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input placeholder="이름 입력" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input placeholder="010-0000-0000" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>구분 *</Label>
              <select
                {...register('type')}
                className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="general">일반</option>
                <option value="actor">배우</option>
              </select>
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

function MemberAvatar({ memberId }: { memberId: string }) {
  const { data: profile } = useQuery({
    queryKey: ['actor-profile', memberId],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<ActorProfile>(`/actor-profiles/${memberId}`)
        return res.data
      } catch {
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
      {profile?.profileImage ? (
        <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
      ) : (
        <User className="w-4 h-4 text-slate-400" />
      )}
    </div>
  )
}
