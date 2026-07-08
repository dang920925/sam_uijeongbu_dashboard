import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ChevronRight } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'
import type { Performance, CreatePerformanceDto } from '@/types'

const performanceSchema = z.object({
  title: z.string().min(1, '공연 제목을 입력해주세요'),
  type: z.enum(['musical', 'play', 'seminar', 'etc']),
  status: z.enum(['upcoming', 'ongoing', 'ended']),
  description: z.string().optional(),
})

type PerformanceForm = z.infer<typeof performanceSchema>

const typeLabel: Record<string, string> = {
  musical: '뮤지컬',
  play: '연극',
  seminar: '세미나',
  etc: '기타',
}

const statusLabel: Record<string, string> = {
  upcoming: '예정',
  ongoing: '진행중',
  ended: '종료',
}

function getStatusVariant(status: string): 'success' | 'warning' | 'secondary' {
  if (status === 'ongoing') return 'success'
  if (status === 'upcoming') return 'warning'
  return 'secondary'
}

export default function Performances() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const { data: performances = [], isLoading } = useQuery({
    queryKey: ['performances'],
    queryFn: async () => {
      const res = await axiosInstance.get<Performance[]>('/performances')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreatePerformanceDto) => {
      const res = await axiosInstance.post<Performance>('/performances', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performances'] })
      setIsOpen(false)
      reset()
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerformanceForm>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      type: 'play',
      status: 'upcoming',
    },
  })

  const onSubmit = (data: PerformanceForm) => {
    createMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">공연 관리</h2>
          <p className="text-sm text-slate-500 mt-1">공연 목록을 관리합니다</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          공연 추가
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
        ) : performances.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">등록된 공연이 없습니다</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공연명</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performances.map((perf) => (
                <TableRow
                  key={perf.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/performances/${perf.id}`)}
                >
                  <TableCell className="font-medium">{perf.title}</TableCell>
                  <TableCell>{typeLabel[perf.type] || perf.type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(perf.status)}>
                      {statusLabel[perf.status] || perf.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(perf.createdAt)}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 공연 생성 모달 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle>공연 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">공연 제목 *</Label>
              <Input id="title" placeholder="공연 제목 입력" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">타입 *</Label>
              <Select id="type" {...register('type')}>
                <option value="musical">뮤지컬</option>
                <option value="play">연극</option>
                <option value="seminar">세미나</option>
                <option value="etc">기타</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">상태 *</Label>
              <Select id="status" {...register('status')}>
                <option value="upcoming">예정</option>
                <option value="ongoing">진행중</option>
                <option value="ended">종료</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" placeholder="공연 설명 입력" rows={3} {...register('description')} />
            </div>

            {createMutation.isError && (
              <p className="text-xs text-red-500">공연 생성 중 오류가 발생했습니다</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                추가
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
