// src/pages/ReporteDiario.jsx
import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getVisibleSales } from '../utils/helpers'

export default function ReporteDiario() {
  const { state, currentUser } = useApp()
  const [report, setReport] = useState('')

  useEffect(() => {
    const visibleSales = getVisibleSales(state.salesHistory, currentUser)
    const dailyTotal = visibleSales.reduce((sum, s) => sum + s.total, 0)

    let header = `REPORTE DIARIO DE VENTAS - ${currentUser?.role === 'admin' ? 'TODAS LAS SUCURSALES' : currentUser?.branch}\n`
    if (currentUser?.role !== 'admin') {
      const users = state.users?.filter(u => u.branch === currentUser.branch && u.role !== 'admin').map(u => u.username).join(', ')
      header += `👤 Encargado(s): ${users || 'Sin asignar'}\n`
    }

    let text = `${header}Generado: ${new Date().toLocaleTimeString('es-MX')}\n\nTotal: $${dailyTotal.toFixed(2)}\nTransacciones: ${visibleSales.length}\n\nDetalle:\n`

    visibleSales.forEach((sale, i) => {
      text += `#${i + 1} [${sale.time}] ${sale.branch} (Cajero: ${sale.user}): $${sale.total.toFixed(2)}\n`
      sale.items.forEach(item => {
        const unt = item.saleType === 'pieza' ? 'pz' : 'g'
        text += `  - ${item.qty}${unt} ${item.name}\n`
      })
    })

    setReport(text)
  }, [state.salesHistory, currentUser])

  const copy = () => { navigator.clipboard.writeText(report); }

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl sm:text-3xl">📊</span> Reporte Diario</h2>
        <button onClick={copy}
          className="btn-action bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2">
          <span>📋</span> Copiar
        </button>
      </div>
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-3 sm:p-6 text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-x-auto" style={{ maxHeight: '60vh', lineHeight: 1.5 }}>
        {report}
      </div>
    </section>
  )
}
