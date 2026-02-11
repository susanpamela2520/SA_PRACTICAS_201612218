import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './components/login.jsx'
import RegisterCliente from './components/registerCliente.jsx'
import RegisterAdmin from './components/registerAdmin.jsx'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_name')
    setToken(null)
  }

  // SE VERIFICA SI EL USUARIO ES ADMIN
  const isAdmin = () => {
    const role = localStorage.getItem('user_role')
    return role === 'ADMIN'
  }

  // PROTECCION PARA LA RUTA ADMIN 
  // childen es un prop especial para react 
  const ProtectedAdminRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" />
    }
    if (!isAdmin()) {
      return (
        <div className="form-card">
          <h2>⛔ Acceso Denegado</h2>
          <p style={{ textAlign: 'center', color: '#666' }}>
            Solo los administradores pueden acceder a esta sección.
          </p>
          <button onClick={() => window.location.href = '/login'}>
            Volver al Login
          </button>
        </div>
      )
    }
    return children
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h1>🍕 Delivereats</h1>
          <div className="nav-links">
            {!token ? (
              <>
                <Link to="/login">Iniciar Sesión</Link>
                <Link to="/register">Registrarse</Link>
              </>
            ) : (
              <>
                <span>Sesión activa ✅ ({localStorage.getItem('user_name')})</span>
                {isAdmin() && <Link to="/admin">Panel Admin</Link>}
                <button onClick={handleLogout}>Cerrar Sesión</button>
              </>
            )}
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<RegisterCliente />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <RegisterAdmin />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                token ? (
                  <div className="form-card">
                    <h2>Bienvenido</h2>
                    <p>Hola, {localStorage.getItem('user_name')}</p>
                    <p>Rol: {localStorage.getItem('user_role')}</p>
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App