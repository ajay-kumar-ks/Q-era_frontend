import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import AIChatWidget from '../ai/AIChatWidget'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isTutor = pathname === '/tutor'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* On /tutor mobile: hide top header but keep bottom nav */}
      <Navbar hideMobileHeader={isTutor} />
      <main className={isTutor ? '' : 'pb-24 md:pb-0'}>
        <Outlet />
      </main>
      <AIChatWidget />
    </div>
  )
}
