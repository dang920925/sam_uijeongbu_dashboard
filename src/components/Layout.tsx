import { Navigate, Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Theater,
  Users,
  FileText,
  Image,
  Calendar,
  LogOut,
} from 'lucide-react'
import { useIsAuthenticated, useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/performances', icon: Theater, label: '공연 관리' },
  { to: '/members', icon: Users, label: '단원 관리' },
  { to: '/applications', icon: FileText, label: '신청서 관리' },
  { to: '/gallery', icon: Image, label: '갤러리' },
  { to: '/schedules', icon: Calendar, label: '일정 관리' },
]

export default function Layout() {
  const isAuthenticated = useIsAuthenticated()
  const logout = useLogout()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 사이드바 */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        {/* 로고 */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <span className="text-lg font-bold tracking-wide text-white">SAM 의정부</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 로그아웃 */}
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0">
          <h1 className="text-base font-semibold text-slate-700">SAM 의정부 관리자 대시보드</h1>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
