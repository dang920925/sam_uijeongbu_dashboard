import { useQuery } from '@tanstack/react-query'
import { Theater, Users, FileText, Calendar } from 'lucide-react'
import axiosInstance from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Performance, Member, Application, Schedule } from '@/types'

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  description?: string
  color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { data: performances = [] } = useQuery({
    queryKey: ['performances'],
    queryFn: async () => {
      const res = await axiosInstance.get<Performance[]>('/performances')
      return res.data
    },
  })

  const { data: actors = [] } = useQuery({
    queryKey: ['members', 'actor'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: Member[] } | Member[]>('/members?type=actor')
      return Array.isArray(res.data) ? res.data : (res.data as { data: Member[] }).data ?? []
    },
  })

  const { data: pendingApplications = [] } = useQuery({
    queryKey: ['applications', 'pending'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: Application[] } | Application[]>('/applications?status=pending')
      return Array.isArray(res.data) ? res.data : (res.data as { data: Application[] }).data ?? []
    },
  })

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: Schedule[] } | Schedule[]>('/schedules')
      return Array.isArray(res.data) ? res.data : (res.data as { data: Schedule[] }).data ?? []
    },
  })

  const ongoingPerformances = performances.filter((p) => p.status === 'ongoing')
  const upcomingPerformances = performances.filter((p) => p.status === 'upcoming')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="text-sm text-slate-500 mt-1">SAM 의정부 현황 요약</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 공연"
          value={performances.length}
          icon={Theater}
          description={`진행중 ${ongoingPerformances.length}개 · 예정 ${upcomingPerformances.length}개`}
          color="bg-blue-500"
        />
        <StatCard
          title="등록 배우"
          value={actors.length}
          icon={Users}
          description="전체 배우 회원"
          color="bg-emerald-500"
        />
        <StatCard
          title="대기 신청서"
          value={pendingApplications.length}
          icon={FileText}
          description="승인 대기 중"
          color="bg-amber-500"
        />
        <StatCard
          title="등록 일정"
          value={schedules.length}
          icon={Calendar}
          description="전체 일정 수"
          color="bg-purple-500"
        />
      </div>

      {/* 최근 공연 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 공연</CardTitle>
          </CardHeader>
          <CardContent>
            {performances.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">등록된 공연이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {performances.slice(0, 5).map((perf) => (
                  <div key={perf.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{perf.title}</p>
                      <p className="text-xs text-slate-500">{perf.type}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        perf.status === 'ongoing'
                          ? 'bg-green-100 text-green-700'
                          : perf.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {perf.status === 'ongoing' ? '진행중' : perf.status === 'upcoming' ? '예정' : '종료'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">대기 중인 신청서</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">대기 중인 신청서가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {pendingApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{app.applicantName}</p>
                      <p className="text-xs text-slate-500">{app.phone || app.email || '-'}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      대기
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
