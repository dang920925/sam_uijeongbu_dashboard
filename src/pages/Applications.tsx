import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Eye, Calendar, Clock, Phone, User, Theater, MessageSquare } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Application, ApplicationStatus, AppType } from '@/types'

const statusLabel: Record<ApplicationStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
}

const genderLabel: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
}

const consultationMethodLabel: Record<string, string> = {
  visit: '방문',
  phone: '전화',
  online: '온라인',
}

function getStatusVariant(status: ApplicationStatus) {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  return 'destructive'
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm bg-slate-50 rounded-md p-3 text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

export default function Applications() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<AppType>('work_observation')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', activeTab, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('appType', activeTab)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await axiosInstance.get<Application[]>(`/applications?${params.toString()}`)
      return res.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const res = await axiosInstance.patch<Application>(`/applications/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setSelectedApp(null)
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axiosInstance.post(`/applications/${id}/approve`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setSelectedApp(null)
    },
  })

  const handleApprove = (app: Application) => {
    const label = activeTab === 'work_observation' ? '참관을 승인하고 멤버로 등록' : '방문 상담을 승인'
    if (confirm(`${app.applicantName}님의 ${label}하시겠습니까?`)) {
      approveMutation.mutate(app.id)
    }
  }

  const handleReject = (app: Application) => {
    if (confirm(`${app.applicantName}님의 신청을 거절하시겠습니까?`)) {
      updateStatusMutation.mutate({ id: app.id, status: 'rejected' })
    }
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">참관 신청 관리</h2>
          <p className="text-sm text-slate-500 mt-1">작품 참관 및 방문 상담 신청을 관리합니다</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <span className="text-amber-600 text-sm font-medium">미처리 {pendingCount}건</span>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab('work_observation'); setStatusFilter('all') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'work_observation'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🎭 작품 참관
        </button>
        <button
          onClick={() => { setActiveTab('consultation'); setStatusFilter('all') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'consultation'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          💬 방문 상담
        </button>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">상태 필터:</span>
        <Select
          className="w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
        >
          <option value="all">전체</option>
          <option value="pending">대기</option>
          <option value="approved">승인</option>
          <option value="rejected">거절</option>
        </Select>
        <span className="text-sm text-slate-500">총 {applications.length}건</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">로딩 중...</div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            {activeTab === 'work_observation' ? '참관 신청이 없습니다' : '방문 상담 신청이 없습니다'}
          </div>
        ) : activeTab === 'work_observation' ? (
          /* 작품 참관 테이블 */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>신청자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>나이 / 성별</TableHead>
                <TableHead>연결 공연</TableHead>
                <TableHead>희망 날짜</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicantName}</TableCell>
                  <TableCell className="text-slate-500">{app.phone}</TableCell>
                  <TableCell className="text-slate-500">
                    {[app.age ? `${app.age}세` : null, app.gender ? genderLabel[app.gender] ?? app.gender : null]
                      .filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {app.performance?.title ?? '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {app.preferredDate ? formatDate(app.preferredDate) : '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(app.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>
                      {statusLabel[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ActionButtons
                      app={app}
                      onView={() => setSelectedApp(app)}
                      onApprove={() => handleApprove(app)}
                      onReject={() => handleReject(app)}
                      approveLoading={approveMutation.isPending}
                      rejectLoading={updateStatusMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          /* 방문 상담 테이블 */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>신청자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>나이 / 성별</TableHead>
                <TableHead>상담 방법</TableHead>
                <TableHead>희망 시간</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicantName}</TableCell>
                  <TableCell className="text-slate-500">{app.phone}</TableCell>
                  <TableCell className="text-slate-500">
                    {[app.age ? `${app.age}세` : null, app.gender ? genderLabel[app.gender] ?? app.gender : null]
                      .filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {app.consultationMethod
                      ? (consultationMethodLabel[app.consultationMethod] ?? app.consultationMethod)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {app.preferredTime ?? '-'}
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(app.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>
                      {statusLabel[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ActionButtons
                      app={app}
                      onView={() => setSelectedApp(app)}
                      onApprove={() => handleApprove(app)}
                      onReject={() => handleReject(app)}
                      approveLoading={approveMutation.isPending}
                      rejectLoading={updateStatusMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 상세 보기 모달 */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent onClose={() => setSelectedApp(null)}>
            <DialogHeader>
              <DialogTitle>
                {selectedApp.appType === 'work_observation' ? '🎭 작품 참관 신청 상세' : '💬 방문 상담 신청 상세'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* 상태 배지 */}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(selectedApp.status)}>
                  {statusLabel[selectedApp.status]}
                </Badge>
                {selectedApp.processedAt && (
                  <span className="text-xs text-slate-400">
                    처리일: {formatDate(selectedApp.processedAt)}
                  </span>
                )}
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <InfoRow label="신청자" value={selectedApp.applicantName} />
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <InfoRow label="연락처" value={selectedApp.phone} />
                </div>
                {selectedApp.age && (
                  <InfoRow label="나이" value={`${selectedApp.age}세`} />
                )}
                {selectedApp.gender && (
                  <InfoRow label="성별" value={genderLabel[selectedApp.gender] ?? selectedApp.gender} />
                )}
              </div>

              <hr className="border-slate-100" />

              {/* 참관 전용 필드 */}
              {selectedApp.appType === 'work_observation' && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedApp.performance && (
                    <div className="col-span-2 flex items-start gap-2">
                      <Theater className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <InfoRow label="연결 공연" value={selectedApp.performance.title} />
                    </div>
                  )}
                  {selectedApp.preferredDate && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <InfoRow label="희망 날짜" value={formatDate(selectedApp.preferredDate)} />
                    </div>
                  )}
                </div>
              )}

              {/* 방문 상담 전용 필드 */}
              {selectedApp.appType === 'consultation' && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedApp.consultationMethod && (
                    <InfoRow
                      label="상담 방법"
                      value={consultationMethodLabel[selectedApp.consultationMethod] ?? selectedApp.consultationMethod}
                    />
                  )}
                  {selectedApp.preferredTime && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <InfoRow label="희망 시간" value={selectedApp.preferredTime} />
                    </div>
                  )}
                </div>
              )}

              {/* 공통 텍스트 필드 */}
              <div className="space-y-3">
                <TextBlock label="신청 동기" value={selectedApp.motivation} />
                <TextBlock label="문의사항" value={selectedApp.question} />
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <InfoRow label="신청일" value={formatDate(selectedApp.createdAt)} />
              </div>

              {/* 액션 버튼 */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedApp)}
                    loading={approveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedApp.appType === 'work_observation' ? '승인 및 멤버 등록' : '상담 승인'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selectedApp)}
                    loading={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    거절
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function ActionButtons({
  app,
  onView,
  onApprove,
  onReject,
  approveLoading,
  rejectLoading,
}: {
  app: Application
  onView: () => void
  onApprove: () => void
  onReject: () => void
  approveLoading: boolean
  rejectLoading: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onView}
        title="상세 보기"
      >
        <Eye className="h-3 w-3" />
      </Button>
      {app.status === 'pending' && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700"
            onClick={onApprove}
            loading={approveLoading}
            title="승인"
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={onReject}
            loading={rejectLoading}
            title="거절"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  )
}
