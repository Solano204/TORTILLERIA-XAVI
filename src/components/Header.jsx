// src/components/Header.jsx
import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { sendWhatsApp } from '../utils/helpers'
import Modal from './Modal'

export default function Header({ onLogout }) {
  const { state, currentUser, showToast } = useApp()
  const [now, setNow] = useState(new Date())
  const [showCorte, setShowCorte] = useState(false)
  const [efectivo, setEfectivo] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-MX')
  const isAdmin = currentUser?.role === 'admin'

  const ejecutarCorte = () => {
    const val = parseFloat(efectivo)
    if (isNaN(val) || val < 0) return showToast('Ingresa una cantidad válida', 'error')
    const ventasHoy = state.salesHistory?.filter(s => s.branch === currentUser.branch) || []
    const esperado = ventasHoy.reduce((sum, s) => sum + s.total, 0)
    const diferencia = val - esperado
    let estado = ''
    if (diferencia === 0) estado = 'Caja cuadrada exactamente ✅'
    else if (diferencia > 0) estado = `Sobran $${diferencia.toFixed(2)} 🟢`
    else estado = `Faltan $${Math.abs(diferencia).toFixed(2)} 🔴`

    const msg = `*CORTE DE CAJA*\nSucursal: ${currentUser.branch}\nUsuario: ${currentUser.username}\nFecha: ${now.toLocaleDateString('es-MX')} a las ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\nEfectivo Esperado: $${esperado.toFixed(2)}\nEfectivo Entregado: $${val.toFixed(2)}\n\nESTADO: ${estado}`
    sendWhatsApp(msg)
    setShowCorte(false)
    setEfectivo('')
    showToast('Abriendo WhatsApp para enviar reporte...')
    setTimeout(() => onLogout(), 3000)
  }

  return (
    <>
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/COMERZIALIZAROA/xavi.jpg" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 bg-white border-2 border-white/50 shadow-sm" />
              <div className="text-center sm:text-left">
                <h1 className="text-lg sm:text-2xl font-bold leading-tight">Sistema-Xavi-Comercializadora</h1>
                <p className="text-amber-100 text-xs sm:text-sm font-semibold tracking-wide">{currentUser?.branch}</p>
              </div>
            </div>
            <div className="flex flex-row items-center justify-between w-full sm:w-auto gap-4 bg-black/10 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl sm:rounded-none">
              <div className="text-left sm:text-right">
                <p className="text-amber-100 text-[10px] sm:text-sm capitalize">{dateStr}</p>
                <p className="text-sm sm:text-xl font-bold">{timeStr}</p>
              </div>
              <div className="border-l border-white/30 pl-4 flex flex-col items-end shrink-0">
                <span className={`font-bold text-xs sm:text-sm px-3 py-1 rounded-full mb-1 ${isAdmin ? 'bg-amber-800 text-white' : 'bg-white/20'}`}>
                  {currentUser?.username}
                </span>
                {!isAdmin && (
                  <button onClick={() => setShowCorte(true)}
                    className="text-xs sm:text-sm text-white font-bold bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg mb-1 transition-all shadow-sm">
                    💰 Corte de Caja
                  </button>
                )}
                <button onClick={onLogout} className="text-[10px] sm:text-xs text-amber-100 hover:text-white underline">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Corte Modal */}
      <Modal show={showCorte} onClose={() => setShowCorte(false)} zIndex="z-[200]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="text-xl font-bold">💰 Corte de Caja</h3>
            <button onClick={() => setShowCorte(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-sm mb-4">Ingresa el total de dinero físico en caja. El sistema comparará con las ventas y enviará el reporte al administrador.</p>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Efectivo Físico Entregado:</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">$</span>
              <input type="number" value={efectivo} onChange={e => setEfectivo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-xl font-bold focus:border-red-500 focus:outline-none"
                placeholder="0.00" />
            </div>
            <button onClick={ejecutarCorte}
              className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-lg transition-all shadow-md">
              Confirmar y Enviar Reporte
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
