import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

export default function Navbar() {
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
      const unread = items.filter((item) => !item.is_read).length
      setUnreadCount(unread)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close "More" sheet when tapping outside
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [moreOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const { theme, toggleTheme } = useTheme()

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Primary mobile nav — 4 items + More
  const primaryMobileLinks = [
    { to: '/dashboard', label: 'Home', icon: '🏠' },
    { to: '/questions', label: 'Questions', icon: '❓' },
    { to: '/exams', label: 'Exams', icon: '📝' },
    { to: '/tutor', label: 'Tutor', icon: '✦' },
  ]

  // "More" sheet links
  const moreMobileLinks = [
    { to: '/calendar', label: 'Calendar', icon: '📅' },
    { to: '/reviews', label: 'Reviews', icon: '🔁' },
    { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-lg font-bold text-indigo-700">
            QERA
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/questions" className={navLinkClass}>Questions</NavLink>
            <NavLink to="/exams" className={navLinkClass}>Exams</NavLink>
            <NavLink to="/calendar" className={navLinkClass}>Calendar</NavLink>
            <NavLink to="/reviews" className={navLinkClass}>Reviews</NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          <Link
            to="/notifications"
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <span className="text-lg" aria-hidden>🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
                {initials || '?'}
              </span>
              <span className="hidden max-w-[120px] truncate sm:inline">{user?.name}</span>
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <Link to="/profile/me" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setMenuOpen(false)}>
                    My profile
                  </Link>
                  <Link to="/reviews" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setMenuOpen(false)}>
                    Reviews
                  </Link>
                  <Link to="/bookmarks" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setMenuOpen(false)}>
                    Bookmarks
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900"
                  >
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

          {/* Primary links */}
          {primaryMobileLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* More button */}
          <div ref={moreRef} className="relative flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                moreOpen
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base leading-none">···</span>
              <span>More</span>
            </button>

            {/* More sheet — pops up above the nav bar */}
            {moreOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {moreMobileLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-200'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
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
