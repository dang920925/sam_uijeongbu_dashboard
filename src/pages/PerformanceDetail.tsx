import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Performance, Class, UpdatePerformanceDto } from '@/types'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

const performanceEditSchema = z.object({
  title: z.string().min(1, '공연 제목을 입력해주세요'),
  type: z.enum(['musical', 'play', 'seminar', 'etc']),
  status: z.enum(['upcoming', 'ongoing', 'ended']),
  description: z.string().optional(),
})

type PerformanceEditForm = z.infer<typeof performanceEditSchema>

const typeLabel: Record<string, string> = { musical: '뮤지컬', play: '연극', seminar: '세미나', etc: '기타' }
const statusLabel: Record<string, string> = { upcoming: '예정', ongoing: '진행중', ended: '종료' }

// 시간 충돌 여부 클라이언트 체크 (마감일 기반)
function hasConflict(cls: any, selectedDays: string[], startTime: string, endTime: string) {
  if (!cls.day_of_week || !cls.start_time || !cls.end_time || cls.status !== 'active') return false
  if (cls.deadline && new Date(cls.deadline) < new Date()) return false

  const existDays = cls.day_of_week.split(',').map((d: string) => d.trim())
  const dayOverlap = selectedDays.some(d => existDays.includes(d))
  if (!dayOverlap) return false

  const existStart = cls.start_time.slice(11, 16)
  const existEnd = cls.end_time.slice(11, 16)
  return startTime < existEnd && endTime > existStart
}

export default function PerformanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isClassOpen, setIsClassOpen] = useState(false)

  // 반 폼 상태
  const [className, setClassName] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [deadline, setDeadline] = useState('')
  const [location, setLocation] = useState('')
  const [classStatus, setClassStatus] = useState<'active' | 'inactive'>('active')
  const [conflictError, setConflictError] = useState('')

  const { data: performance, isLoading } = useQuery({
    queryKey: ['performances', id],
    queryFn: async () => {
      const res = await axiosInstance.get<Performance>(`/performances/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const res = await axiosInstance.get<Class[]>(`/classes?performanceId=${id}`)
      return res.data
    },
    enabled: !!id,
  })

  // 전체 반 목록 (충돌 체크용)
  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: async () => {
      const res = await axiosInstance.get<Class[]>('/classes')
      return res.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePerformanceDto) => {
      const res = await axiosInstance.patch<Performance>(`/performances/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performances', id] })
      queryClient.invalidateQueries({ queryKey: ['performances'] })
      setIsEditOpen(false)
    },
  })

  const createClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.post<Class>('/classes', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', id] })
      queryClient.invalidateQueries({ queryKey: ['classes', 'all'] })
      setIsClassOpen(false)
      resetClassForm()
    },
    onError: (err: any) => {
      setConflictError(err.response?.data?.message || '오류가 발생했습니다')
    },
  })

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      await axiosInstance.delete(`/classes/${classId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', id] })
      queryClient.invalidateQueries({ queryKey: ['classes', 'all'] })
    },
  })

  const { register: editRegister, handleSubmit: handleEditSubmit, reset: editReset, formState: { errors: editErrors } } =
    useForm<PerformanceEditForm>({ resolver: zodResolver(performanceEditSchema) })

  const resetClassForm = () => {
    setClassName(''); setSelectedDays([]); setStartTime(''); setEndTime('')
    setDeadline(''); setLocation(''); setClassStatus('active'); setConflictError('')
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
    setConflictError('')
  }

  // 요일/시간 선택 시 실시간 충돌 체크
  const checkConflict = (days: string[], start: string, end: string) => {
    if (days.length === 0 || !start || !end) return false
    return allClasses.some((c: any) => hasConflict(c, days, start, end))
  }

  const conflicting = checkConflict(selectedDays, startTime, endTime)

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!className.trim()) return
    if (conflicting) {
      setConflictError('선택한 요일/시간에 이미 다른 반이 있습니다')
      return
    }
    createClassMutation.mutate({
      name: className,
      performance_id: id,
      days_of_week: selectedDays.join(','),
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      deadline: deadline || undefined,
      location: location || undefined,
      status: classStatus,
    })
  }

  const handleEditOpen = () => {
    if (performance) {
      editReset({ title: performance.title, type: performance.type, status: performance.status, description: performance.description || '' })
    }
    setIsEditOpen(true)
  }

  if (isLoading) return <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
  if (!performance) return <div className="py-12 text-center text-sm text-slate-400">공연을 찾을 수 없습니다</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/performances')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{performance.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">공연 상세 정보</p>
        </div>
      </div>

      {/* 공연 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">공연 정보</CardTitle>
          <Button variant="outline" size="sm" onClick={handleEditOpen}>
            <Pencil className="h-3 w-3 mr-1" />수정
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-500 mb-1">공연명</p><p className="text-sm font-medium">{performance.title}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">타입</p><p className="text-sm font-medium">{typeLabel[performance.type] || performance.type}</p></div>
            <div>
              <p className="text-xs text-slate-500 mb-1">상태</p>
              <Badge variant={performance.status === 'ongoing' ? 'success' : performance.status === 'upcoming' ? 'warning' : 'secondary'}>
                {statusLabel[performance.status]}
              </Badge>
            </div>
            <div><p className="text-xs text-slate-500 mb-1">등록일</p><p className="text-sm">{formatDate(performance.createdAt)}</p></div>
            {performance.description && (
              <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">설명</p><p className="text-sm">{performance.description}</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 반 관리 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">반(Class) 관리</CardTitle>
          <Button size="sm" onClick={() => { resetClassForm(); setIsClassOpen(true) }}>
            <Plus className="h-3 w-3 mr-1" />반 추가
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {classes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">등록된 반이 없습니다</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>반 이름</TableHead>
                  <TableHead>요일</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls: any) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell className="text-slate-500">{cls.day_of_week || '-'}</TableCell>
                    <TableCell className="text-slate-500">
                      {cls.start_time && cls.end_time
                        ? `${cls.start_time.slice(11,16)} ~ ${cls.end_time.slice(11,16)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {cls.deadline ? formatDate(cls.deadline) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cls.status === 'active' ? 'success' : 'secondary'}>
                        {cls.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => { if (confirm('반을 삭제하시겠습니까?')) deleteClassMutation.mutate(cls.id) }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 공연 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onClose={() => setIsEditOpen(false)}>
          <DialogHeader><DialogTitle>공연 수정</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label>공연 제목 *</Label>
              <Input {...editRegister('title')} />
              {editErrors.title && <p className="text-xs text-red-500">{editErrors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>타입</Label>
              <Select {...editRegister('type')}>
                <option value="musical">뮤지컬</option><option value="play">연극</option>
                <option value="seminar">세미나</option><option value="etc">기타</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select {...editRegister('status')}>
                <option value="upcoming">예정</option><option value="ongoing">진행중</option><option value="ended">종료</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea rows={3} {...editRegister('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>취소</Button>
              <Button type="submit" loading={updateMutation.isPending}>저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 반 추가 모달 */}
      <Dialog open={isClassOpen} onOpenChange={setIsClassOpen}>
        <DialogContent onClose={() => { setIsClassOpen(false); resetClassForm() }}>
          <DialogHeader><DialogTitle>반 추가</DialogTitle></DialogHeader>
          <form onSubmit={handleClassSubmit} className="space-y-4">
            {/* 반 이름 */}
            <div className="space-y-2">
              <Label>반 이름 *</Label>
              <Input
                placeholder="예: A반, 주말반"
                value={className}
                onChange={e => setClassName(e.target.value)}
              />
            </div>

            {/* 요일 선택 */}
            <div className="space-y-2">
              <Label>요일 (복수 선택 가능)</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(day => {
                  const isSelected = selectedDays.includes(day)
                  const wouldConflict = !isSelected && checkConflict([...selectedDays, day], startTime, endTime)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={wouldConflict}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : wouldConflict
                          ? 'bg-red-50 text-red-300 border border-red-200 cursor-not-allowed'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작 시간</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setConflictError('') }}
                />
              </div>
              <div className="space-y-2">
                <Label>종료 시간</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setConflictError('') }}
                />
              </div>
            </div>

            {/* 충돌 경고 */}
            {conflicting && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md text-red-600 text-xs">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                선택한 요일/시간에 이미 운영 중인 반이 있습니다
              </div>
            )}

            {/* 마감일 */}
            <div className="space-y-2">
              <Label>마감일 <span className="text-slate-400 font-normal">(선택, 마감 후 해당 시간 재사용 가능)</span></Label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            {/* 장소 */}
            <div className="space-y-2">
              <Label>장소</Label>
              <Input
                placeholder="연습실 A"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            {/* 상태 */}
            <div className="space-y-2">
              <Label>상태</Label>
              <select
                value={classStatus}
                onChange={e => setClassStatus(e.target.value as 'active' | 'inactive')}
                className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>

            {conflictError && (
              <p className="text-xs text-red-500">{conflictError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsClassOpen(false); resetClassForm() }}>취소</Button>
              <Button type="submit" loading={createClassMutation.isPending} disabled={conflicting}>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
