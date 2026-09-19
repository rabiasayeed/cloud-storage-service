import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!localStorage.getItem('cloudly_token')) { setLoading(false); return }
    api.me().then(result => setUser(result.user)).catch(() => localStorage.removeItem('cloudly_token')).finally(() => setLoading(false))
  }, [])
  const value = useMemo(() => ({
    user, loading,
    async login(payload) { const result = await api.login(payload); localStorage.setItem('cloudly_token', result.session.access_token); setUser(result.user); return result.user },
    async register(payload) { return api.register(payload) },
    logout() { localStorage.removeItem('cloudly_token'); setUser(null) }
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)