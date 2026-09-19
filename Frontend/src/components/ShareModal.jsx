import { useState } from 'react'
export default function ShareModal({ file, onClose, onShare, busy }) {
  const [email, setEmail] = useState('')
  const submit = event => { event.preventDefault(); if (email.trim()) onShare?.(email.trim()) }
  if (!file) return null
  return <div className="backdrop" onClick={onClose}><form className="modal" onClick={event => event.stopPropagation()} onSubmit={submit}><button type="button" className="close" onClick={onClose}>x</button><h2>Share file</h2><p>Invite someone to collaborate on {file.name}.</p><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@email.com" /><button className="submit" disabled={busy}>{busy ? 'Sending...' : 'Send invite'}</button></form></div>
}