import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Performances from '@/pages/Performances'
import PerformanceDetail from '@/pages/PerformanceDetail'
import Members from '@/pages/Members'
import Applications from '@/pages/Applications'
import GalleryPage from '@/pages/Gallery'
import Schedules from '@/pages/Schedules'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/performances" element={<Performances />} />
            <Route path="/performances/:id" element={<PerformanceDetail />} />
            <Route path="/members" element={<Members />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/schedules" element={<Schedules />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
