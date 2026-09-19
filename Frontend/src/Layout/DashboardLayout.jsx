import { useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Breadcrumb from '../components/Breadcrumb'
import Toolbar from '../components/Toolbar'

export default function DashboardLayout({
  active = 'My files',
  user = null,
  title,
  query = '',
  view = 'grid',
  children,
  onNavigate,
  onUpload,
  onLogout,
  onQuery,
  onView,
  onNewFolder
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = useMemo(() => (user?.name || user?.email || 'CU').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(), [user])
  const pageTitle = title || (active === 'My files' ? 'Overview' : active)
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return <div className="app-shell">
    <div className={mobileOpen ? 'layout-sidebar open' : 'layout-sidebar'}>
      <Sidebar active={active} user={user} onNavigate={page => { onNavigate?.(page); setMobileOpen(false) }} onUpload={onUpload} onLogout={onLogout} />
    </div>
    <main className="layout-main">
      <header className="dashboard-header">
        <button className="mobile-menu" type="button" aria-label="Toggle navigation" onClick={() => setMobileOpen(current => !current)}>Menu</button>
        <Breadcrumb items={['My files', pageTitle]} onNavigate={onNavigate} />
        <div className="header-actions"><span className="header-user">{user?.name || user?.email || 'Cloudly user'}</span><button className="mini" type="button" aria-label="User profile">{initials}</button></div>
      </header>
      <div className="content">
        <section className="welcome">
          <div><p>{today}</p><h1>{pageTitle}</h1><span>Manage your files and folders in one place.</span></div>
          <button className="new" type="button" onClick={onNewFolder}>+ New folder</button>
        </section>
        <Toolbar query={query} onQuery={onQuery} view={view} onView={onView} onNewFolder={onNewFolder} />
        <section aria-label={pageTitle}>{children}</section>
      </div>
    </main>
  </div>
}
DashboardLayout.displayName = 'DashboardLayout'