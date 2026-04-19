// src/pages/Calendario.jsx
import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { fetchSalesByDate, fetchSalesByDateRange } from '../services/dataService'

export default function Calendario({ onDateFilter }) {
  const { state, updateState, currentUser, showToast, selectedFilterDate, setSelectedFilterDate } = useApp()
  const [calDate, setCalDate] = useState(new Date())
  const [daysWithSales, setDaysWithSales] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const isAdmin = currentUser?.role === 'admin'

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

  useEffect(() => { loadMonthSales() }, [calDate])

  const loadMonthSales = async () => {
    setLoading(true)
    try {
      const year = calDate.getFullYear()
      const month = calDate.getMonth()
      const startMs = new Date(year, month, 1).getTime()
      const endMs = new Date(year, month + 1, 0, 23, 59, 59).getTime()
      const sales = await fetchSalesByDateRange(startMs, endMs)
      const days = new Set()
      sales.forEach(sale => {
        if (isAdmin || sale.branch === currentUser?.branch) days.add(sale.dateString)
      })
      setDaysWithSales(days)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const selectDate = async (dateStr) => {
    showToast(`Viajando al: ${new Date(dateStr).toLocaleDateString('es-MX')}...`)
    try {
      const sales = await fetchSalesByDate(dateStr)
      const sorted = sales.sort((a, b) => a.timestamp - b.timestamp)
      const filtered = isAdmin ? sorted : sorted.filter(s => s.branch === currentUser?.branch)
      setSelectedFilterDate(dateStr)
      updateState({ salesHistory: sorted })
      setSummary({
        date: new Date(dateStr).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        total: filtered.reduce((s, sale) => s + sale.total, 0),
        trans: filtered.length
      })
      showToast('Datos históricos cargados')
    } catch (e) {
      console.error(e)
      showToast('Error al buscar historial', 'error')
    }
  }

  const clearFilter = async () => {
    setSelectedFilterDate(null)
    setSummary(null)
    showToast('Volviendo al día de Hoy...')
    try {
      const sales = await fetchSalesByDate(new Date().toDateString())
      updateState({ salesHistory: sales.sort((a, b) => a.timestamp - b.timestamp) })
    } catch (e) { console.error(e) }
  }

  const year = calDate.getFullYear()
  const month = calDate.getMonth()
  let firstDay = new Date(year, month, 1).getDay()
  firstDay = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toDateString()

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl sm:text-3xl">📅</span> Historial de Ventas</h2>
        <button onClick={clearFilter}
          className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
          Volver al día de Hoy
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() - 1); return nd })}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"><span className="text-xl">⬅️</span></button>
          <span className="font-bold text-lg sm:text-xl text-gray-800 capitalize">
            {loading ? 'Cargando...' : `${monthNames[month]} ${year}`}
          </span>
          <button onClick={() => setCalDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + 1); return nd })}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm"><span className="text-xl">➡️</span></button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="p-2" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateObj = new Date(year, month, day)
            const dateStr = dateObj.toDateString()
            const hasSales = daysWithSales.has(dateStr)
            const isSelected = selectedFilterDate && new Date(selectedFilterDate).toDateString() === dateStr
            const isToday = today === dateStr

            let cls = 'relative h-12 sm:h-16 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all border-2 cursor-pointer '
            if (isSelected) cls += 'bg-amber-500 text-white border-amber-600 shadow-lg scale-105 z-10'
            else if (hasSales) cls += 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100 shadow-sm'
            else cls += 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
            if (isToday && !isSelected) cls += ' ring-2 ring-amber-400 ring-offset-2'

            return (
              <button key={day} className={cls} onClick={() => selectDate(dateStr)}>
                <span className={isToday ? 'font-black' : ''}>{day}</span>
                {hasSales && <span className="w-2 h-2 rounded-full bg-orange-500 mt-1 shadow-sm" />}
              </button>
            )
          })}
        </div>
      </div>

      {summary && (
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-amber-800 font-bold mb-2 text-lg">Resumen del <span className="underline">{summary.date}</span></h3>
          <div className="flex justify-between items-center bg-white p-3 rounded-lg mb-2 shadow-sm">
            <span className="text-gray-600 font-semibold">Total vendido:</span>
            <span className="font-black text-xl text-green-600">${summary.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center bg-white p-3 rounded-lg mb-3 shadow-sm">
            <span className="text-gray-600 font-semibold">Transacciones:</span>
            <span className="font-black text-xl text-gray-800">{summary.trans}</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-700 bg-amber-100 p-2 rounded-lg font-semibold text-center">
            💡 Navega a "Diario" o "Estadísticas" para ver el detalle de esta fecha.
          </p>
        </div>
      )}
    </section>
  )
}
