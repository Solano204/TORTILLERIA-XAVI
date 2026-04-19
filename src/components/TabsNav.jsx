// src/components/TabsNav.jsx
import React, { useRef } from 'react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'punto-venta', label: '🛒 Punto de Venta', always: true },
  { id: 'ventas-dia', label: '🧾 Ventas del Día', always: true },
  { id: 'almacen', label: '🌾 Almacén', always: true },
  { id: 'inventario-productos', label: '🧃 Stock Piezas', adminOnly: true },
  { id: 'registro-entradas', label: '📝 Registro Entradas', adminOnly: true },
  { id: 'reporte-diario', label: '📊 Diario', always: true },
  { id: 'reporte-semanal', label: '📈 Semanal', always: true },
  { id: 'estadisticas', label: '📉 Estadísticas', always: true },
  { id: 'usuarios', label: '👥 Usuarios', adminOnly: true },
  { id: 'calendario', label: '📅 Calendario', adminOnly: true },
  { id: 'mensual', label: '📑 Cierre Mensual', adminOnly: true },
]

export default function TabsNav({ activeTab, onTabChange }) {
  const { currentUser } = useApp()
  const sliderRef = useRef(null)
  const isAdmin = currentUser?.role === 'admin'

  const visibleTabs = TABS.filter(t => t.always || (isAdmin && t.adminOnly))

  // Drag to scroll
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onMouseDown = (e) => {
    drag.current = { isDown: true, startX: e.pageX - sliderRef.current.offsetLeft, scrollLeft: sliderRef.current.scrollLeft }
    sliderRef.current.style.cursor = 'grabbing'
  }
  const onMouseUp = () => { drag.current.isDown = false; sliderRef.current.style.cursor = 'grab' }
  const onMouseMove = (e) => {
    if (!drag.current.isDown) return
    e.preventDefault()
    const x = e.pageX - sliderRef.current.offsetLeft
    const walk = (x - drag.current.startX) * 1.5
    sliderRef.current.scrollLeft = drag.current.scrollLeft - walk
  }
  const onWheel = (e) => {
    if (e.deltaY !== 0) { e.preventDefault(); sliderRef.current.scrollLeft += e.deltaY }
  }

  return (
    <div className="bg-white shadow-md border-b-2 sm:border-b-4 border-amber-500 sticky top-0 z-40 shrink-0 no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div
          ref={sliderRef}
          className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1 sm:py-0 select-none"
          style={{ cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseUp}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onWheel={onWheel}
        >
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 sm:px-6 sm:py-4 font-bold text-center whitespace-nowrap border-b-2 sm:border-b-4 text-sm sm:text-base transition-all hover:bg-amber-50
                ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
