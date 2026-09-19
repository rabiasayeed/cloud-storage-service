const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const request = async (path, options = {}) => {
  const token = localStorage.getItem('cloudly_token')
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', 'Bearer ' + token)
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(baseURL + path, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error && body.error.message ? body.error.message : 'Request failed')
  return body
}
const api = {
  request,
  register: payload => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: payload => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'), updateProfile: payload => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  folders: parentId => request('/folders' + (parentId ? '?parentId=' + encodeURIComponent(parentId) : '')),
  createFolder: payload => request('/folders', { method: 'POST', body: JSON.stringify(payload) }), renameFolder: (id, name) => request('/folders/' + id, { method: 'PATCH', body: JSON.stringify({ name }) }), moveFolder: (id, parentId) => request('/folders/' + id + '/move', { method: 'PATCH', body: JSON.stringify({ parentId }) }), deleteFolder: id => request('/folders/' + id, { method: 'DELETE' }), restoreFolder: id => request('/folders/' + id + '/restore', { method: 'PATCH' }),
  files: folderId => request('/files' + (folderId ? '?folderId=' + encodeURIComponent(folderId) : '')),
  upload: (file, folderId) => { const body = new FormData(); body.append('file', file); if (folderId) body.append('folderId', folderId); return request('/files/upload', { method: 'POST', body }) },
  download: id => request('/files/' + id + '/download'),
  trash: () => request('/files/trash'),
  recent: () => request('/recent'),
  shared: () => request('/shares/with-me'),
  search: params => request('/search?' + new URLSearchParams(params)),
  star: payload => request('/stars', { method: 'POST', body: JSON.stringify(payload) }),
  unstar: payload => request('/stars', { method: 'DELETE', body: JSON.stringify(payload) }),
  share: payload => request('/shares', { method: 'POST', body: JSON.stringify(payload) }),  deleteFile: id => request('/files/' + id, { method: 'DELETE' }),  restoreFile: id => request('/files/' + id + '/restore', { method: 'PATCH' }),  permanentDeleteFile: id => request('/files/' + id + '/permanent', { method: 'DELETE' }),  renameFile: (id, name) => request('/files/' + id, { method: 'PATCH', body: JSON.stringify({ name }) }),  moveFile: (id, folderId) => request('/files/' + id + '/move', { method: 'PATCH', body: JSON.stringify({ folderId }) }),  copyFile: (id, folderId) => request('/files/' + id + '/copy', { method: 'POST', body: JSON.stringify({ folderId }) }), createPublicLink: payload => request('/link-shares', { method: 'POST', body: JSON.stringify(payload) })
}
export default api