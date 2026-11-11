import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

const EMPTY_LOGIN = { username: '', password: '' }
const EMPTY_REG = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
}

const REGISTRATION_STEPS = [
  { title: 'Empecemos por conocerte', description: '¿Cómo te llamas?' },
  { title: 'Elige tu nombre de usuario', description: 'Así podrás identificar tu cuenta al iniciar sesión.' },
  { title: 'Crea una contraseña', description: 'Usa una contraseña segura para proteger tu cuenta.' },
]

export default function AdminAuth() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('welcome')
  const [step, setStep] = useState(0)
  const [stepDirection, setStepDirection] = useState('next')
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [regForm, setRegForm] = useState(EMPTY_REG)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const chooseMode = (nextMode) => {
    setError('')
    setStepDirection('next')
    setMode(nextMode)
  }

  const onLogin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(loginForm.username, loginForm.password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const onRegisterStep = async (e) => {
    e.preventDefault()
    setError('')
    if (step < REGISTRATION_STEPS.length - 1) {
      setStepDirection('next')
      setStep((current) => current + 1)
      return
    }
    if (regForm.password !== regForm.password_confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setBusy(true)
    try {
      await register(regForm)
      // El registro crea la tienda y deja su activación pendiente de pago.
      // El panel muestra el siguiente paso al iniciar sesión.
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const backToWelcome = () => {
    setError('')
    setStepDirection('back')
    setMode('welcome')
  }

  const previousStep = () => {
    setError('')
    setStepDirection('back')
    setStep((current) => Math.max(0, current - 1))
  }

  const updateReg = (key, value) => setRegForm((form) => ({ ...form, [key]: value }))

  return (
    <main className="admin-auth">
      {mode === 'welcome' ? (
        <section key="welcome" className="auth-card auth-welcome-card">
          <div className="auth-brand">
            <img className="auth-logo" src="/images/libredrop.webp" alt="LibreDrop" />
            <span>Tu tienda en línea, más fácil</span>
          </div>
          <div className="auth-welcome-copy">
            <p className="auth-eyebrow">Panel de administración</p>
            <h1>Hola, bienvenido a LibreDrop</h1>
            <p>¿Qué te gustaría hacer?</p>
          </div>
          <div className="auth-choice-grid">
            <button className="auth-choice" onClick={() => chooseMode('login')}>
              <span className="auth-choice-icon" aria-hidden="true">↪</span>
              <span><strong>Iniciar sesión</strong><small>Continúa administrando tu tienda</small></span>
              <span className="auth-choice-arrow" aria-hidden="true">→</span>
            </button>
            <button className="auth-choice primary" onClick={() => chooseMode('register')}>
              <span className="auth-choice-icon" aria-hidden="true">＋</span>
              <span><strong>Crear tienda</strong><small>Regístrate y empieza a vender</small></span>
              <span className="auth-choice-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      ) : (
        <section key={mode} className="auth-card">
          <button type="button" className="auth-back-link" onClick={mode === 'register' && step > 0 ? previousStep : backToWelcome}>
            <span aria-hidden="true">←</span> {mode === 'register' && step > 0 ? 'Paso anterior' : 'Volver'}
          </button>
          <div className="auth-brand">
            <img className="auth-logo" src="/images/libredrop.webp" alt="LibreDrop" />
            <span>panel de tiendas</span>
          </div>

          {mode === 'login' ? (
            <>
              <div className="auth-form-heading">
                <h1>Iniciar sesión</h1>
                <p>Ingresa a tu cuenta para administrar tu tienda.</p>
              </div>
              <form className="form" onSubmit={onLogin}>
                <label className="field">
                  <span className="field-label">Nombre de usuario</span>
                  <input autoComplete="username" required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Contraseña</span>
                  <input type="password" autoComplete="current-password" required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </label>
                <button className="btn block" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
                {error && <div className="alert" role="alert">{error}</div>}
              </form>
              <p className="auth-switch-copy">¿No tienes cuenta? <button type="button" onClick={() => chooseMode('register')}>Regístrate aquí</button></p>
            </>
          ) : (
            <>
              <div className="auth-progress" aria-label={`Paso ${step + 1} de ${REGISTRATION_STEPS.length}`}>
                {REGISTRATION_STEPS.map((item, index) => (
                  <span key={item.title} className={`${index <= step ? 'complete' : ''}${index === step ? ' current' : ''}`} />
                ))}
              </div>
              <div key={step} className={`auth-step-view ${stepDirection}`}>
                <div className="auth-form-heading">
                  <span className="auth-step-label">Paso {step + 1} de {REGISTRATION_STEPS.length}</span>
                  <h1>{step === 1 && regForm.first_name ? `¡Qué gusto, ${regForm.first_name}!` : REGISTRATION_STEPS[step].title}</h1>
                  <p>{REGISTRATION_STEPS[step].description}</p>
                </div>
                <form className="form" onSubmit={onRegisterStep}>
                  {step === 0 && (
                    <>
                      <label className="field">
                        <span className="field-label">Nombre</span>
                        <input autoComplete="given-name" required autoFocus value={regForm.first_name} onChange={(e) => updateReg('first_name', e.target.value)} />
                      </label>
                      <label className="field">
                        <span className="field-label">Apellido</span>
                        <input autoComplete="family-name" required value={regForm.last_name} onChange={(e) => updateReg('last_name', e.target.value)} />
                      </label>
                      <label className="field">
                        <span className="field-label">Correo electrónico</span>
                        <input type="email" autoComplete="email" required value={regForm.email} onChange={(e) => updateReg('email', e.target.value)} />
                      </label>
                    </>
                  )}
                  {step === 1 && (
                    <label className="field">
                      <span className="field-label">Nombre de usuario</span>
                      <input autoComplete="username" minLength={3} required autoFocus placeholder="Ej. pedrito1234" value={regForm.username} onChange={(e) => updateReg('username', e.target.value)} />
                      <small className="auth-field-hint">Lo usarás para iniciar sesión en LibreDrop.</small>
                    </label>
                  )}
                  {step === 2 && (
                    <>
                      <p className="auth-personal-greeting">¡Perfecto, {regForm.username}! Ya casi terminamos.</p>
                      <label className="field">
                        <span className="field-label">Contraseña</span>
                        <input type="password" autoComplete="new-password" required autoFocus minLength={8} value={regForm.password} onChange={(e) => updateReg('password', e.target.value)} />
                      </label>
                      <label className="field">
                        <span className="field-label">Confirma tu contraseña</span>
                        <input type="password" autoComplete="new-password" required minLength={8} value={regForm.password_confirm} onChange={(e) => updateReg('password_confirm', e.target.value)} />
                      </label>
                    </>
                  )}
                  <button className="btn block" disabled={busy}>
                    {busy ? 'Creando tu cuenta…' : step === REGISTRATION_STEPS.length - 1 ? 'Crear mi cuenta' : 'Siguiente'}
                  </button>
                  {error && <div className="alert" role="alert">{error}</div>}
                </form>
              </div>
              <p className="auth-switch-copy">¿Ya tienes cuenta? <button type="button" onClick={() => chooseMode('login')}>Inicia sesión</button></p>
            </>
          )}
        </section>
      )}
    </main>
  )
}
