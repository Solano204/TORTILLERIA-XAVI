// src/pages/Estadisticas.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { fetchSalesFrom } from '../services/dataService'
import { getVisibleSales } from '../utils/helpers'

export default function Estadisticas() {
  const { state, currentUser, showToast } = useApp()
  const isAdmin = currentUser?.role === 'admin'
  const [weekData, setWeekData] = useState([])
  const [branchStats, setBranchStats] = useState([])

  const visibleSales = getVisibleSales(state.salesHistory, currentUser)
  const dailyTotal = visibleSales.reduce((s, sale) => s + sale.total, 0)
  const dailyAvg = visibleSales.length > 0 ? dailyTotal / visibleSales.length : 0
  const productCount = {}
  visibleSales.forEach(sale => sale.items.forEach(i => { productCount[i.name] = (productCount[i.name] || 0) + 1 }))
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  const loadWeeklyData = useCallback(async () => {
    try {
      const hace7Dias = new Date()
      hace7Dias.setDate(hace7Dias.getDate() - 6)
      hace7Dias.setHours(0, 0, 0, 0)

      const ventasSemana = await fetchSalesFrom(hace7Dias.getTime())

      const byDay = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7Dias)
        d.setDate(d.getDate() + i)
        byDay[d.toDateString()] = { date: d.toDateString(), total: 0, trans: 0 }
      }

      ventasSemana.forEach(sale => {
        if (isAdmin || sale.branch === currentUser?.branch) {
          if (byDay[sale.dateString]) { byDay[sale.dateString].total += sale.total; byDay[sale.dateString].trans++ }
        }
      })

      setWeekData(Object.values(byDay))

      if (isAdmin) {
        const uniqueBranches = [...new Set(state.users.map(u => u.branch))].filter(b => b && b !== 'Todas')
        const bStats = uniqueBranches.map(bName => {
          const bSales = visibleSales.filter(s => s.branch === bName)
          const bTotal = bSales.reduce((s, sale) => s + sale.total, 0)
          const bProductCount = {}
          bSales.forEach(sale => sale.items.forEach(i => { bProductCount[i.name] = (bProductCount[i.name] || 0) + 1 }))
          const bTop = Object.entries(bProductCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
          const users = state.users.filter(u => u.branch === bName && u.role !== 'admin').map(u => u.username).join(', ') || 'Sin asignar'
          return { name: bName, total: bTotal, count: bSales.length, avg: bSales.length > 0 ? bTotal / bSales.length : 0, top: bTop, users }
        })
        setBranchStats(bStats)
      }
    } catch (e) { console.error(e) }
  }, [isAdmin, currentUser, visibleSales, state.users])

  useEffect(() => { loadWeeklyData() }, [state.salesHistory])

  const weeklyTotal = weekData.reduce((s, d) => s + d.total, 0)
  const weeklyTrans = weekData.reduce((s, d) => s + d.trans, 0)
  const weeklyDailyAvg = weekData.length > 0 ? weeklyTotal / weekData.length : 0
  const weeklyTicketAvg = weeklyTrans > 0 ? weeklyTotal / weeklyTrans : 0
  const maxDailyTotal = Math.max(...weekData.map(d => d.total), 1)

  const today = new Date().toDateString()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">📉</span>
          {isAdmin ? 'Global y por Sucursal' : `Estadísticas - ${currentUser?.branch}`}
        </h2>
        {isAdmin && (
          <button onClick={loadWeeklyData}
            className="btn-action bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-sm">
            🔄 Actualizar Datos
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Today */}
        <section className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><span className="text-xl sm:text-2xl">📅</span> Hoy</h3>
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            {[['Ventas:', `$${dailyTotal.toFixed(2)}`], ['Tickets:', visibleSales.length], ['Promedio:', `$${dailyAvg.toFixed(2)}`], ['Top producto:', topProduct]].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center border-b border-blue-400 pb-2 sm:pb-3 last:border-0">
                <span className="text-blue-100">{label}</span>
                <span className="text-xl sm:text-2xl font-bold truncate ml-2">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Week */}
        <section className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><span className="text-xl sm:text-2xl">📊</span> Semana</h3>
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            {[['Ingreso:', `$${weeklyTotal.toFixed(2)}`], ['Tickets:', weeklyTrans], ['Prom. diario:', `$${weeklyDailyAvg.toFixed(2)}`], ['Ticket prom:', `$${weeklyTicketAvg.toFixed(2)}`]].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center border-b border-purple-400 pb-2 sm:pb-3 last:border-0">
                <span className="text-purple-100">{label}</span>
                <span className="text-xl sm:text-2xl font-bold">{val}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Branch stats */}
      {isAdmin && branchStats.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2"><span className="text-xl sm:text-2xl">🏢</span> Por Sucursal (Hoy)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {branchStats.map(b => (
              <div key={b.name} className="bg-white rounded-2xl shadow border-2 border-gray-100 p-4 sm:p-5 relative overflow-hidden hover:shadow-lg hover:border-blue-200 group">
                <div className="absolute -right-4 -top-4 text-5xl sm:text-6xl opacity-10">🏬</div>
                <div className="border-b border-gray-100 pb-2 mb-2 sm:mb-3">
                  <h4 className="text-base sm:text-lg font-bold text-gray-800">{b.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">👤 {b.users}</p>
                </div>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Ventas:</span><span className="font-bold text-blue-600">${b.total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tickets:</span><span className="font-bold text-gray-800">{b.count}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Promedio:</span><span className="font-bold text-gray-800">${b.avg.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Top:</span><span className="font-bold text-amber-600 truncate ml-2 max-w-[100px]">{b.top}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📈 Últimos 7 días</h3>
        {weeklyTotal === 0
          ? <p className="text-gray-400 text-xs sm:text-sm text-center py-8">No hay ventas registradas en los últimos 7 días.</p>
          : (
            <div className="flex items-end justify-around gap-1 sm:gap-2 md:gap-4 h-48 sm:h-64 bg-gray-50 rounded-xl p-2 sm:p-4 overflow-hidden">
              {weekData.map(day => {
                const height = Math.max(10, (day.total / maxDailyTotal) * (window.innerWidth < 640 ? 120 : 150))
                const dayDate = new Date(day.date)
                let dayName = dayDate.toLocaleDateString('es-MX', { weekday: 'short' })
                if (day.date === today) dayName = 'Hoy'
                const kValue = day.total >= 1000 ? `$${(day.total / 1000).toFixed(1)}k` : `$${day.total.toFixed(0)}`
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1 sm:gap-2">
                    <div title={`$${day.total.toFixed(2)}`}
                      className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm sm:rounded-t-lg w-6 sm:w-8 md:w-12 shadow-sm"
                      style={{ height: `${height}px` }} />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-600 capitalize">{dayName}</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">{kValue}</span>
                  </div>
                )
              })}
            </div>
          )
        }
      </section>
    </div>
  )
}
