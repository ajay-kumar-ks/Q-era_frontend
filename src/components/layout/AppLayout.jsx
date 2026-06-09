import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import AIChatWidget from '../ai/AIChatWidget'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="pb-24 md:pb-0">
        <Outlet />
      </main>
      <AIChatWidget />
    </div>
  )
}
