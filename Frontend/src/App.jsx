import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import api from './services/api'

const demoFolders = [{ id: 'demo-1', name: 'Design Assets' }, { id: 'demo-2', name: 'Work Projects' }, { id: 'demo-3', name: 'Personal' }]
const demoFiles = [
  { id: 'demo-f1', name: 'Q4 Brand Guidelines.pdf', mime_type: 'application/pdf', size_bytes: 8400000, updated_at: new Date().toISOString(), starred: true },
  { id: 'demo-f2', name: 'Product Roadmap 2025.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size_bytes: 2100000, updated_at: new Date(Date.now() - 86400000).toISOString(), starred: false },
  { id: 'demo-f3', name: 'Homepage Exploration.png', mime_type: 'image/png', size_bytes: 14800000, updated_at: new Date(Date.now() - 172800000).toISOString(), starred: true }
]
const nav = [['My files', '[]'], ['Recent', 'R'], ['Starred', '*'], ['Shared with me', 'S'], ['Trash', 'T']]
const bytes = value => value > 1048576 ? (value / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((value || 0) / 1024)) + ' KB'
const typeOf = file => (file.name || 'FILE').split('.').pop().toUpperCase().slice(0, 5)
const colorOf = file => file.mime_type && file.mime_type.includes('pdf') ? 'red' : file.mime_type && file.mime_type.includes('image') ? 'purple' : file.mime_type && file.mime_type.includes('zip') ? 'amber' : 'blue'
const dateOf = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'
const storageText = value => { if (!value) return '0 B'; if (value >= 1073741824) return (value / 1073741824).toFixed(1) + ' GB'; if (value >= 1048576) return (value / 1048576).toFixed(1) + ' MB'; return Math.ceil(value / 1024) + ' KB' }

function Auth({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = mode === 'login' ? await api.login(form) : await api.register(form)
      if (result.session && result.session.access_token) {
        localStorage.setItem('cloudly_token', result.session.access_token); onSuccess(result.user)
      } else if (mode === 'register') { setMode('login'); setError('Account created. Please sign in.') }
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <div className="auth-shell"><div className="auth-card"><div className="brand"><b>*</b> Cloudly</div><div className="modal-icon">*</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>Secure, simple storage for everything you work on.</p><form onSubmit={submit}>{mode === 'register' && <input required placeholder="Your name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /><input required minLength="6" type="password" placeholder="Password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />{error && <div className="notice">{error}</div>}<button className="submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button><button className="demo-button" onClick={() => onSuccess({ name: 'Jordan Davis', demo: true })}>Preview demo workspace</button></div></div>
}

function ProfilePage({ user, initials, onPhotoChange, onPhotoOpen }) {
  const name = user.name || 'Cloudly user'
  const email = user.email || 'No email available'
  return <section className="profile-page">
    <div className="profile-card"><label className="profile-photo-picker"><div className="profile-avatar" onClick={() => user.image_url && onPhotoOpen?.()} title={user.image_url ? 'Open profile photo' : 'Choose a profile photo'}>{user.image_url ? <img src={user.image_url} alt="Profile" /> : initials}</div><input type="file" accept="image/*" onChange={onPhotoChange} /><span>Change photo</span></label><div><h2>{name}</h2><p>{email}</p><span className="profile-plan">{user.demo ? 'Demo workspace' : 'Free plan'}</span></div></div>
    <div className="profile-details"><h2>Profile details</h2><label>Full name<strong>{name}</strong></label><label>Email address<strong>{email}</strong></label><label>Account type<strong>{user.demo ? 'Demo account' : 'Free account'}</strong></label></div>
  </section>
}

function ProfilePhotoPage({ user, onBack }) {
  return <section className="profile-photo-page">
    <button className="new" type="button" onClick={onBack}>Back to profile</button>
    {user.image_url ? <img src={user.image_url} alt="Profile" /> : <p>No profile photo selected.</p>}
  </section>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [active, setActive] = useState('My files')
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [shareEmail, setShareEmail] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const picker = useRef(null)

  useEffect(() => {
    const demoUser = localStorage.getItem('cloudly_demo_user')
    const token = localStorage.getItem('cloudly_token')
    if (demoUser) {
      try { setUser(JSON.parse(demoUser)) } catch { localStorage.removeItem('cloudly_demo_user') }
      setAuthReady(true)
      return
    }
    if (!token) { setAuthReady(true); return }
    api.me()
      .then(result => setUser(result.user))
      .catch(() => localStorage.removeItem('cloudly_token'))
      .finally(() => setAuthReady(true))
  }, [])

  const saveProfilePhoto = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = async () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
        try {
          const nextUser = user.demo ? { ...user, image_url: imageUrl } : (await api.updateProfile({ imageUrl })).user
          if (nextUser.demo) localStorage.setItem('cloudly_demo_user', JSON.stringify(nextUser))
          setUser(nextUser)
          setNotice('Profile photo updated')
        } catch (caught) { setError(caught.message) }
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const load = async section => {
    setLoading(true); setError('')
    try {
      if (section === 'Trash') { const result = await api.trash(); setFiles(result.files || []); setFolders([]) }
      else if (section === 'Recent') { const result = await api.recent(); setFiles(result.files || []) }
      else if (section === 'Shared with me') { const result = await api.shared(); setFiles(result.files || result.shares || []) }
      else { const results = await Promise.all([api.folders(currentFolder?.id), api.files(currentFolder?.id)]); setFolders(results[0].folders || []); setFiles(results[1].files || []) }
    } catch (caught) {
      setError(caught.message)
      if (user && user.demo) { setFolders(demoFolders); setFiles(demoFiles) }
    } finally { setLoading(false) }
  }
  useEffect(() => { if (user && !user.demo) load(active) }, [user, active, currentFolder])
  useEffect(() => { if (user && user.demo) { setFolders(demoFolders); setFiles(demoFiles) } }, [user])

  const visible = useMemo(() => files.filter(file => (file.name || '').toLowerCase().includes(query.toLowerCase())).filter(file => active !== 'Starred' || file.starred), [files, query, active])
  const visibleFolders = useMemo(() => folders.filter(folder => (folder.name || '').toLowerCase().includes(query.toLowerCase())), [folders, query])
  const storageUsed = useMemo(() => files.reduce((total, file) => total + Number(file.size_bytes || 0), 0), [files])
  const storagePercent = Math.min(100, Math.round((storageUsed / (15 * 1073741824)) * 100))
  const close = () => { setModal(''); setSelected(null); setShareEmail(''); setFolderName(''); setRenameName(''); setLinkUrl('') }
  const upload = async event => {
    const chosen = Array.from(event.target.files || event.dataTransfer.files || [])
    if (!chosen.length) return
    try {
      if (user.demo) setFiles(current => [...chosen.map((file, index) => ({ id: 'demo-upload-' + Date.now() + index, name: file.name, mime_type: file.type, blob: file, size_bytes: file.size, updated_at: new Date().toISOString(), starred: false })), ...current])
      else { const uploaded = await Promise.all(chosen.map(file => api.upload(file, currentFolder?.id))); setFiles(current => [...uploaded.map(item => item.file), ...current]) }
      setNotice(chosen.length + ' file(s) uploaded'); close()
    } catch (caught) { setError(caught.message); close() }
  }
  const createFolder = async event => {
    event.preventDefault(); if (!folderName.trim()) return
    try {
      const result = user.demo ? { folder: { id: 'demo-folder-' + Date.now(), name: folderName.trim() } } : await api.createFolder({ name: folderName.trim(), parentId: currentFolder?.id })
      setFolders(current => [...current, result.folder]); setNotice('Folder created'); close()
    } catch (caught) { setError(caught.message) }
  }
  const copyFile = async event => {
    event.preventDefault()
    if (!selected) return
    const folderId = event.currentTarget.folder.value || null
    try {
      if (user.demo) {
        const copy = { ...selected, id: 'demo-copy-' + Date.now(), name: 'Copy of ' + selected.name }
        setFiles(current => [...current, copy])
      } else {
        const result = await api.copyFile(selected.id, folderId)
        if ((currentFolder?.id || null) === folderId) setFiles(current => [...current, result.file])
      }
      setNotice('File copied')
      close()
    } catch (caught) { setError(caught.message) }
  }
  const toggleStar = async file => {
    const starred = !file.starred; setFiles(current => current.map(item => item.id === file.id ? { ...item, starred } : item))
    if (!user.demo) { try { await (starred ? api.star : api.unstar)({ resourceType: 'file', resourceId: file.id }) } catch (caught) { setError(caught.message) } }
  }
  const download = async file => {
    if (user.demo) {
      if (!file.blob) { setNotice('This sample file is not available to open in demo mode'); return }
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return
    }
    const preview = window.open('about:blank', '_blank', 'noopener,noreferrer')
    try {
      const result = await api.download(file.id)
      if (preview) preview.location.href = result.signedUrl
      else window.location.href = result.signedUrl
    } catch (caught) {
      if (preview) preview.close()
      setError(caught.message)
    }
  }
  const saveFile = async file => {
    try {
      if (user.demo) {
        if (!file.blob) { setNotice('This sample file is not available to download in demo mode'); return }
        const url = URL.createObjectURL(file.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setNotice('Download started')
        return
      }
      const result = await api.download(file.id)
      const link = document.createElement('a')
      link.href = result.signedUrl
      link.download = file.name
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
      setNotice('Download started')
    } catch (caught) { setError(caught.message) }
  }
  const removeFile = async file => {
    try {
      if (!user.demo) {
        if (active === 'Trash') await api.permanentDeleteFile(file.id)
        else await api.deleteFile(file.id)
      }
      setFiles(current => current.filter(item => item.id !== file.id))
      setNotice(active === 'Trash' ? 'File permanently deleted' : 'File moved to trash')
    } catch (caught) { setError(caught.message) }
  }
  const restoreFile = async file => {
    try { await api.restoreFile(file.id); setFiles(current => current.filter(item => item.id !== file.id)); setNotice('File restored') } catch (caught) { setError(caught.message) }
  }
  const share = async event => {
    event.preventDefault(); if (!selected || !shareEmail.trim()) return
    try { if (!user.demo) await api.share({ resourceType: 'file', resourceId: selected.id, granteeUserId: shareEmail.trim(), role: 'viewer' }); setNotice('Invite sent'); close() } catch (caught) { setError(caught.message) }
  }
  const renameFile = async event => {
    event.preventDefault(); if (!selected || !renameName.trim()) return
    try { if (!user.demo) await api.renameFile(selected.id, renameName.trim()); setFiles(current => current.map(item => item.id === selected.id ? { ...item, name: renameName.trim() } : item)); setNotice('File renamed'); close() } catch (caught) { setError(caught.message) }
  }
  const renameFolder = async event => {
    event.preventDefault(); if (!selected || !renameName.trim()) return
    try { if (!user.demo) await api.renameFolder(selected.id, renameName.trim()); setFolders(current => current.map(item => item.id === selected.id ? { ...item, name: renameName.trim() } : item)); setNotice('Folder renamed'); close() } catch (caught) { setError(caught.message) }
  }
  const deleteFolder = async folder => {
    try {
      if (!user.demo) await api.deleteFolder(folder.id)
      setFolders(current => current.filter(item => item.id !== folder.id))
      setNotice('Folder deleted')
    } catch (caught) { setError(caught.message) }
  }
  const copyText = async text => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const input = document.createElement('textarea')
      input.value = text
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()
      input.select()
      const copied = document.execCommand('copy')
      input.remove()
      return copied
    }
  }
  const createLink = async (file, showModal = true) => {
    const target = file || selected
    if (!target) return
    try { const result = user.demo ? { linkShare: { token: 'demo-link' } } : await api.createPublicLink({ resourceType: 'file', resourceId: target.id }); const url = window.location.origin + '/shared/' + result.linkShare.token; setLinkUrl(url); const copied = await copyText(url); setNotice(copied ? 'Public link copied' : 'Could not copy the public link'); if (showModal) setModal('link') } catch (caught) { setError(caught.message) }
  }
  if (!authReady) return <div className="empty-state">Loading your account...</div>
  if (!user) return <Auth onSuccess={nextUser => { if (nextUser.demo) localStorage.setItem('cloudly_demo_user', JSON.stringify(nextUser)); setUser(nextUser) }} />
  const name = user.name || user.email || 'Jordan'
  const initials = name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><b>*</b> Cloudly</div><button className="upload" onClick={() => setModal('upload')}>+ Upload files</button><nav>{nav.map(([label, icon]) => <button key={label} className={active === label ? 'active' : ''} onClick={() => { setActive(label); if (label === 'My files') setCurrentFolder(null) }}><Icon>{icon}</Icon>{label}</button>)}</nav><button className={active === 'Profile' ? 'active' : ''} onClick={() => setActive('Profile')}><Icon>U</Icon>My profile</button><div className="side-bottom"><div className="storage"><span>Storage</span><span>{storageText(storageUsed)} / 15 GB</span></div><div className="progress"><i style={{ width: storagePercent + '%' }} /></div><button className="upgrade">* <span><strong>Get more storage</strong><small>Upgrade your plan</small></span>&gt;</button><button onClick={() => { localStorage.removeItem('cloudly_token'); localStorage.removeItem('cloudly_demo_user'); setUser(null) }}>Sign out</button><button className="profile" type="button" onClick={() => setActive('Profile')}><b>{initials}</b><span><strong>{name}</strong><small>{user.demo ? 'Demo workspace' : 'Free plan'}</small></span></button></div></aside><main><header><div className="crumb"><span>My files</span> / <b>{active === 'My files' ? 'Overview' : active}</b></div><div className="actions"><label className="search">? <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search files and folders" /></label><button className="mini" type="button" aria-label="Open my profile" onClick={() => setActive('Profile')}>{initials}</button></div></header><div className="content">{active === 'Profile photo' ? <><section className="welcome"><div><p>Account</p><h1>Profile photo</h1><span>View your profile photo.</span></div></section><ProfilePhotoPage user={user} onBack={() => setActive('Profile')} /></> : active === 'Profile' ? <><section className="welcome"><div><p>Account</p><h1>My profile</h1><span>Review your account details and workspace plan.</span></div></section><ProfilePage user={user} initials={initials} onPhotoChange={saveProfilePhoto} onPhotoOpen={() => setActive('Profile photo')} /></> : <>{notice && <div className="toast">{notice}<button onClick={() => setNotice('')}>x</button></div>}{error && <div className="notice page-notice">{error}<button onClick={() => setError('')}>x</button></div>}<section className="welcome"><div><p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p><h1>{active === 'My files' ? (currentFolder ? currentFolder.name : 'Good morning, ' + name.split(' ')[0]) : active}</h1><span>Here is what is happening with your files today.</span></div><div>{currentFolder && <button className="new" onClick={() => setCurrentFolder(null)}>Back to My files</button>}<button className="new" onClick={() => setModal('folder')}>+ New folder</button></div></section>{active === 'My files' && <section className="stats"><Stat icon="[]" label="All files" value={files.length} note="Your workspace" /><Stat icon="S" label="Shared with me" value="-" note="Invite collaborators" /><Stat icon="~" label="Storage used" value={storageText(storageUsed)} note={storagePercent + "% of 15 GB used"} /></section>}<section className="block"><div className="heading"><h2>Folders <small>{visibleFolders.length} folders</small></h2><button onClick={() => setModal('folder')}>+ New folder</button></div><div className={view === 'grid' ? 'folder-grid' : 'folder-list'}>{visibleFolders.map(folder => <button className="folder" key={folder.id} onClick={() => { setCurrentFolder(folder); setActive('My files'); setQuery('') }}><i className="blue">~</i><span><strong>{folder.name}</strong><small>Updated recently</small></span><em onClick={event => { event.stopPropagation(); setSelected(folder); setRenameName(folder.name); setModal('rename-folder') }}>...</em><span className="folder-delete" onClick={event => { event.stopPropagation(); deleteFolder(folder) }}>Delete</span></button>)}<button className="folder add" onClick={() => setModal('folder')}><b>+</b><strong>Create new folder</strong></button></div></section><section className="block files"><div className="heading"><h2>{active === 'My files' ? 'Recent files' : active} <small>{visible.length} files</small></h2><div><button type="button" aria-pressed={view === 'grid'} className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>Grid</button><button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}>List</button></div></div>{loading ? <div className="empty-state">Loading...</div> : visible.length ? <div className={view === 'grid' ? 'file-grid' : 'file-list'}>{visible.map(file => <article className="file" key={file.id}><div className="file-top"><b className={'type ' + colorOf(file)}>{typeOf(file)}</b><button className="star" onClick={() => toggleStar(file)}>{file.starred ? '*' : 'o'}</button></div><strong title={file.name}>{file.name}</strong><small>{bytes(file.size_bytes)} - {dateOf(file.updated_at)}</small><footer><i>{initials}</i><span>You</span><button onClick={() => { setSelected(file); setModal('share') }}>Share</button><button onClick={() => download(file)}>Open</button><button onClick={() => saveFile(file)}>Download</button>{active !== 'Trash' && <><button onClick={() => { setSelected(file); setRenameName(file.name); setModal('rename') }}>Rename</button><button onClick={() => { setSelected(file); setModal('move') }}>Move</button><button onClick={() => createLink(file)}>Link</button><button onClick={() => { setSelected(file); setModal('copy') }}>Copy</button></>}{active === 'Trash' ? <button onClick={() => restoreFile(file)}>Restore</button> : <button onClick={() => removeFile(file)}>Delete</button>}</footer></article>)}</div> : <div className="empty-state"><b>No files here yet</b><span>Upload a file or create a folder to get started.</span><button className="new" onClick={() => setModal('upload')}>Upload a file</button></div>}</section></>}</div></main>{modal && <div className="backdrop" onClick={close}><div className="modal" onClick={event => event.stopPropagation()}><button className="close" onClick={close}>x</button>{modal === 'upload' ? <><div className="modal-icon">^</div><h2>Upload files</h2><p>Choose files from your computer.</p><button className="drop" onClick={() => picker.current.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); upload(event) }}>^<b>Click to choose files or drop here</b><small>Choose any file from your computer</small></button><input ref={picker} hidden type="file" multiple onChange={upload} /></> : modal === 'folder' ? <form onSubmit={createFolder}><h2>Create a folder</h2><p>Keep your files organized.</p><input autoFocus required value={folderName} onChange={event => setFolderName(event.target.value)} placeholder="Folder name" /><button className="submit">Create folder</button></form> : modal === 'rename' ? <form onSubmit={renameFile}><h2>Rename file</h2><input autoFocus required value={renameName} onChange={event => setRenameName(event.target.value)} /><button className="submit">Save name</button></form> : modal === 'rename-folder' ? <form onSubmit={renameFolder}><h2>Rename folder</h2><input autoFocus required value={renameName} onChange={event => setRenameName(event.target.value)} /><button className="submit">Save name</button></form> : modal === 'copy' ? <form onSubmit={copyFile}><h2>Copy file</h2><p>Choose the destination folder.</p><select name="folder" defaultValue=""><option value="">My files</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button className="submit">Copy file</button></form> : modal === 'move' ? <form onSubmit={async event => { event.preventDefault(); const folderId = event.currentTarget.folder.value || null; try { if (!user.demo) await api.moveFile(selected.id, folderId); setNotice('File moved'); close() } catch (caught) { setError(caught.message) } }}><h2>Move file</h2><p>Choose a destination folder.</p><select name="folder" defaultValue=""><option value="">My files</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button className="submit">Move file</button></form> : modal === 'link' ? <div><h2>Public link created</h2><p>{linkUrl}</p><button className="submit" onClick={close}>Done</button></div> : <form onSubmit={share}><h2>Share file</h2><p>Invite someone to collaborate on {selected && selected.name}.</p><input required type="email" value={shareEmail} onChange={event => setShareEmail(event.target.value)} placeholder="name@email.com" /><button className="submit">Send invite</button></form>}</div></div>}</div>
}
const Icon = ({ children }) => <span className="icon">{children}</span>
const Stat = ({ icon, label, value, note }) => <div className="stat"><i>{icon}</i><span>{label}<strong>{value}</strong><small>{note}</small></span></div>