// src/pages/Login.jsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { state, setCurrentUser, showToast } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    const matched = state.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )
    if (matched) {
      setCurrentUser(matched)
      localStorage.setItem('pos_current_user', JSON.stringify(matched))
      showToast(`Bienvenido, ${matched.username}`)
    } else {
      showToast('Usuario o contraseña incorrectos', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-slide">
        <div className="text-center mb-6 sm:mb-8">
          <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/COMERZIALIZAROA/xavi.jpg" alt="Logo Xavi" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-amber-100" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Xavi</h2>
          <p className="text-sm sm:text-base text-gray-500">Sistema Multi-Sucursal Comercializadora</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-600">Usuario</label>
            <input
              type="text" required value={username} onChange={e => setUsername(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 text-sm sm:text-base focus:border-amber-500 focus:outline-none"
              placeholder="Ej: sucursal uno"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-600">Contraseña</label>
            <div className="relative mt-1">
              <input
                type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm sm:text-base focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 text-xl transition-colors">
                {showPwd ? '🌽' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-xl mt-2 text-sm sm:text-base">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  )
}
