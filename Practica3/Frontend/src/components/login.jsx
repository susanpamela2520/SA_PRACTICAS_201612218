import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

function Login({ setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await login({ email, password })
      
      if (result.ok) {
        // GUARDAMOS TOKEN EN LOCALSTORAGE 
        localStorage.setItem('token', result.token)
        
       // AQUI SE GUARDA LA INFO DEL USUARION EN EL LOCALSTORAGE
        if (result.user) {
          localStorage.setItem('user_email', result.user.email)
          localStorage.setItem('user_role', result.user.role)
          localStorage.setItem('user_name', result.user.nombreCompleto)
        }
        
        setToken(result.token)
        setMessage('✅ Login exitoso')
        
        // AQUI REDIRECCIONAMOS AL USUARIO SEGUN SU ROL
        setTimeout(() => {
          if (result.user.role === 'ADMIN') {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        }, 1000)
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ Error al conectar con el servidor')
    }
  }

  return (
    <div className="form-card">
      <h2>🔐 Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Iniciar Sesión</button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default Login