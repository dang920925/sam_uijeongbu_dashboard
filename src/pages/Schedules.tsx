import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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
import { formatDateTime } from '@/lib/utils'
import type { Schedule, CreateScheduleDto, ScheduleType } from '@/types'

const scheduleSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  type: z.enum(['practice', 'show', 'event', 'etc']),
  startTime: z.string().min(1, '시작 시간을 입력해주세요'),
  endTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

const typeLabel: Record<ScheduleType, string> = {
  practice: '연습',
  show: '공연',
  event: '이벤트',
  etc: '기타',
}

const typeColors: Record<ScheduleType, string> = {
  practice: 'secondary',
  show: 'default',
  event: 'warning',
  etc: 'outline',
}

export default function Schedules() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [typeFilter, setTypeFilter] = useState<ScheduleType | 'all'>('all')

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', typeFilter],
    queryFn: async () => {
      const params = typeFilter !== 'all' ? `?type=${typeFilter}` : ''
      const res = await axiosInstance.get<Schedule[]>(`/schedules${params}`)
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateScheduleDto) => {
      const res = await axiosInstance.post<Schedule>('/schedules', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateScheduleDto> }) => {
      const res = await axiosInstance.patch<Schedule>(`/schedules/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/schedules/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { type: 'practice' },
  })

  const handleOpen = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule)
      reset({
        title: schedule.title,
        type: schedule.type,
        startTime: schedule.startTime ? schedule.startTime.slice(0, 16) : '',
        endTime: schedule.endTime ? schedule.endTime.slice(0, 16) : '',
        location: schedule.location || '',
        description: schedule.description || '',
      })
    } else {
      setEditingSchedule(null)
      reset({ type: 'practice' })
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingSchedule(null)
    reset()
  }

  const onSubmit = (data: ScheduleForm) => {
    const payload: CreateScheduleDto = {
      ...data,
      endTime: data.endTime || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
    }
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">일정 관리</h2>
          <p className="text-sm text-slate-500 mt-1">연습, 공연, 이벤트 일정을 관리합니다</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4 mr-2" />
          일정 추가
        </Button>
      </div>

      {/* 타입 필터 */}
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setTypeFilter('all')}
        >
          전체
        </button>
        {(Object.keys(typeLabel) as ScheduleType[]).map((type) => (
          <button
            key={type}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeFilter === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setTypeFilter(type)}
          >
            {typeLabel[type]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
        ) : schedules.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">등록된 일정이 없습니다</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>시작 시간</TableHead>
                <TableHead>종료 시간</TableHead>
                <TableHead>장소</TableHead>
                <TableHead className="w-20">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.title}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[schedule.type] as 'default' | 'secondary' | 'outline' | 'warning'}>
                      {typeLabel[schedule.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDateTime(schedule.startTime)}</TableCell>
                  <TableCell className="text-slate-500">
                    {schedule.endTime ? formatDateTime(schedule.endTime) : '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">{schedule.location || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpen(schedule)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => {
                          if (confirm('일정을 삭제하시겠습니까?')) {
                            deleteMutation.mutate(schedule.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 일정 추가/수정 모달 */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent onClose={handleClose}>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? '일정 수정' : '일정 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input placeholder="일정 제목" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>타입</Label>
              <Select {...register('type')}>
                <option value="practice">연습</option>
                <option value="show">공연</option>
                <option value="event">이벤트</option>
                <option value="etc">기타</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작 시간 *</Label>
                <Input type="datetime-local" {...register('startTime')} />
                {errors.startTime && (
                  <p className="text-xs text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>종료 시간</Label>
                <Input type="datetime-local" {...register('endTime')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>장소</Label>
              <Input placeholder="장소 입력" {...register('location')} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea rows={2} placeholder="일정 설명" {...register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>취소</Button>
              <Button
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingSchedule ? '저장' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
