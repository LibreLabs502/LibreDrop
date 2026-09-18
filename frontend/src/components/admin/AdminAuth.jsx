import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goToTenantAdmin } from '../../api'
import { useAuth } from '../../store/AuthContext'

const EMPTY_LOGIN = { username: '', password: '' }
const EMPTY_REG = { username: '', email: '', password: '', confirm_password: '', tenant_name: '' }

export default function AdminAuth() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [regForm, setRegForm] = useState(EMPTY_REG)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const onLogin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const tokens = await login(loginForm.username, loginForm.password)
      if (tokens.domain && !goToTenantAdmin(tokens.domain)) navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onRegister = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      await register(regForm)
      setOk('Cuenta creada. Iniciando sesión…')
      const tokens = await login(regForm.username, regForm.password)
      if (tokens.domain && !goToTenantAdmin(tokens.domain)) navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-auth">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="auth-logo" src="/images/libredrop.jpg" alt="LibreDrop" />
          <span>panel de tiendas</span>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            <img className="auth-tab-icon" src="/images/libredrop_icon.jpg" alt="" />
            Iniciar sesión
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            <img className="auth-tab-icon" src="/images/libredrop_icon.jpg" alt="" />
            Crear cuenta
          </button>
        </div>

        {mode === 'login' ? (
          <form className="form" onSubmit={onLogin}>
            <label className="field">
              <span className="field-label">Usuario</span>
              <input value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Contraseña</span>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </label>
            <button className="btn block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
            {error && <div className="alert">{error}</div>}
          </form>
        ) : (
          <form className="form" onSubmit={onRegister}>
            <label className="field">
              <span className="field-label">Usuario</span>
              <input value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Nombre de tu tienda</span>
              <input value={regForm.tenant_name} placeholder="p. ej. Mi Tienda" onChange={(e) => setRegForm({ ...regForm, tenant_name: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Contraseña</span>
              <input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Confirmar contraseña</span>
              <input type="password" value={regForm.confirm_password} onChange={(e) => setRegForm({ ...regForm, confirm_password: e.target.value })} />
            </label>
            <button className="btn block" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
            {error && <div className="alert">{error}</div>}
            {ok && <div className="alert ok">{ok}</div>}
          </form>
        )}
      </div>
    </div>
  )
}