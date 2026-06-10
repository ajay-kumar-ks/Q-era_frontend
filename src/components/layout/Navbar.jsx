import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Home, HelpCircle, ClipboardList, Sparkles, Calendar,
  RotateCcw, Trophy, Settings, Bell, Sun, Moon, LogOut,
  User, Bookmark, Menu, X, MoreHorizontal, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

export default function Navbar({ hideMobileHeader = false }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const moreRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/')
      const items = Array.isArray(data) ? data : data?.items ?? []
      setUnreadCount(items.filter((item) => !item.is_read).length)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (!moreOpen) return
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [moreOpen])

  const handleLogout = () => { logout(); navigate('/login') }
  const { theme, toggleTheme } = useTheme()

  const initials = user?.name
    ?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  // Primary mobile nav — 4 items + More
  const primaryMobileLinks = [
    { to: '/dashboard', label: 'Home',      Icon: Home },
    { to: '/questions', label: 'Questions', Icon: HelpCircle },
    { to: '/exams',     label: 'Exams',     Icon: ClipboardList },
    { to: '/tutor',     label: 'Tutor',     Icon: Sparkles },
  ]

  // "More" sheet links
  const moreMobileLinks = [
    { to: '/calendar',    label: 'Calendar',    Icon: Calendar },
    { to: '/reviews',     label: 'Reviews',     Icon: RotateCcw },
    { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', Icon: Settings }] : []),
  ]

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

      {/* ── Top header bar ── */}
      <div className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 ${hideMobileHeader ? 'hidden lg:flex' : ''}`}>

        {/* Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-lg font-bold text-indigo-700 tracking-tight">
            QERA
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/dashboard"  className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/questions"  className={navLinkClass}>Questions</NavLink>
            <NavLink to="/exams"      className={navLinkClass}>Exams</NavLink>
            <NavLink to="/calendar"   className={navLinkClass}>Calendar</NavLink>
            <NavLink to="/reviews"    className={navLinkClass}>Reviews</NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
            {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {theme === 'dark'
              ? <Sun size={18} />
              : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
                />
              ) : (
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {initials || <User size={14} />}
                </span>
              )}
              <span className="hidden max-w-[110px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
                {user?.name}
              </span>
            </button>

            {menuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {[
                    { to: '/profile/me', label: 'My profile', Icon: User },
                    { to: '/reviews',    label: 'Reviews',    Icon: RotateCcw },
                    { to: '/bookmarks',  label: 'Bookmarks',  Icon: Bookmark },
                  ].map(({ to, label, Icon }) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Icon size={14} className="text-slate-400" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-1 py-1">

          {primaryMobileLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* More */}
          <div ref={moreRef} className="relative flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                moreOpen
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <MoreHorizontal size={20} strokeWidth={1.75} />
              <span>More</span>
            </button>

            {moreOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {moreMobileLinks.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-200'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon size={16} className="text-slate-400 dark:text-slate-500" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
