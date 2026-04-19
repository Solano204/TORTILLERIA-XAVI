// src/pages/ReporteSemanal.jsx
import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchSalesFrom } from '../services/dataService'

export default function ReporteSemanal() {
  const { state, currentUser } = useApp()
  const [report, setReport] = useState('Cargando reporte semanal...')

  useEffect(() => { generateReport() }, [])

  const generateReport = async () => {
    const isAdmin = currentUser?.role === 'admin'
    const reportBranch = isAdmin ? 'GLOBAL (Todas las Sucursales)' : currentUser?.branch

    try {
      const hace7Dias = new Date()
      hace7Dias.setDate(hace7Dias.getDate() - 6)
      hace7Dias.setHours(0, 0, 0, 0)

      const ventasSemana = await fetchSalesFrom(hace7Dias.getTime())
      if (!ventasSemana.length) { setReport('No hay ventas registradas en la red.'); return }

      let totalSemanal = 0, transaccionesTotales = 0
      let mejorDia = { nombre: '', total: -1 }, peorDia = { nombre: '', total: Infinity }
      const productSummary = {}, branchSummary = {}, ventasPorDia = {}

      ventasSemana.forEach(sale => {
        if (isAdmin || sale.branch === currentUser?.branch) {
          if (!ventasPorDia[sale.dateString]) {
            const d = new Date(sale.timestamp)
            ventasPorDia[sale.dateString] = { name: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }), total: 0, trans: 0 }
          }
          ventasPorDia[sale.dateString].total += sale.total
          ventasPorDia[sale.dateString].trans++
          totalSemanal += sale.total
          transaccionesTotales++
          if (isAdmin) {
            if (!branchSummary[sale.branch]) branchSummary[sale.branch] = { total: 0, count: 0 }
            branchSummary[sale.branch].total += sale.total
            branchSummary[sale.branch].count++
          }
          sale.items.forEach(item => {
            if (!productSummary[item.name]) productSummary[item.name] = { qty: 0, total: 0, emoji: item.emoji, type: item.saleType }
            productSummary[item.name].qty += item.qty
            productSummary[item.name].total += item.total
          })
        }
      })

      Object.values(ventasPorDia).forEach(day => {
        if (day.total > mejorDia.total) mejorDia = { nombre: day.name, total: day.total }
        if (day.total < peorDia.total) peorDia = { nombre: day.name, total: day.total }
      })

      const details = Object.values(ventasPorDia)
      if (!details.length) { setReport('No hay ventas registradas.'); return }

      const promTicket = transaccionesTotales > 0 ? totalSemanal / transaccionesTotales : 0
      const promDiario = totalSemanal / details.length

      let text = `╔════════════════════════════════════════════════════════════╗\n║              REPORTE SEMANAL DE RENDIMIENTO                ║\n╚════════════════════════════════════════════════════════════╝\n\n`
      text += `🏢 Negocio:   ${state.businessName}\n📍 Sucursal:  ${reportBranch}\n📅 Generado:  ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}\n👤 Solicitó:  ${currentUser?.username}\n\n`
      text += `══════════════════════════════════════════════════════════════\n📊 RESUMEN EJECUTIVO\n══════════════════════════════════════════════════════════════\n`
      text += `💰 Ingreso Total:       $${totalSemanal.toFixed(2)}\n🧾 Transacciones:       ${transaccionesTotales} tickets\n📈 Promedio Diario:     $${promDiario.toFixed(2)} por día activo\n🎯 Ticket Promedio:     $${promTicket.toFixed(2)} por cliente\n\n`
      text += `🏆 Mejor Día:           ${mejorDia.nombre?.padEnd(25)} -> $${mejorDia.total.toFixed(2)}\n📉 Día más bajo:        ${peorDia.nombre?.padEnd(25)} -> $${peorDia.total.toFixed(2)}\n\n`

      if (isAdmin && Object.keys(branchSummary).length > 0) {
        text += `══════════════════════════════════════════════════════════════\n🏢 DESGLOSE POR SUCURSAL\n══════════════════════════════════════════════════════════════\n`
        Object.entries(branchSummary).sort((a, b) => b[1].total - a[1].total).forEach(([branch, data]) => {
          const pct = ((data.total / totalSemanal) * 100).toFixed(1)
          const users = state.users?.filter(u => u.branch === branch && u.role !== 'admin').map(u => u.username).join(', ') || 'Sin asignar'
          text += `  • ${branch.padEnd(16)} $${data.total.toFixed(2).padStart(8)} (${pct}%) | ${data.count} ventas\n    👤 ${users}\n\n`
        })
      }

      text += `══════════════════════════════════════════════════════════════\n📦 PRODUCTOS MÁS VENDIDOS\n══════════════════════════════════════════════════════════════\n`
      Object.entries(productSummary).sort((a, b) => b[1].total - a[1].total).forEach(([name, data], idx) => {
        const amt = data.type === 'pieza' ? `${data.qty} Pz` : `${(data.qty / 1000).toFixed(2)} Kg`
        text += `  ${String(idx + 1).padStart(2, '0')}. ${data.emoji} ${name.padEnd(22)} ${amt.padStart(9)}  ->  $${data.total.toFixed(2)}\n`
      })
      text += '\n'

      text += `══════════════════════════════════════════════════════════════\n📅 VENTAS DÍA POR DÍA\n══════════════════════════════════════════════════════════════\n`
      details.forEach(day => {
        const nombre = day.name.charAt(0).toUpperCase() + day.name.slice(1)
        text += `  🗓️ ${nombre.padEnd(30)}\n     Total: $${day.total.toFixed(2).padEnd(10)} | Tickets: ${day.trans}\n     --------------------------------------------------\n`
      })
      text += `\n====================== FIN DEL REPORTE ======================\n`
      setReport(text)
    } catch (e) {
      console.error(e)
      setReport('Error de red al cargar el reporte.')
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl sm:text-3xl">📈</span> Reporte Semanal</h2>
        <div className="flex gap-2">
          <button onClick={generateReport}
            className="btn-action bg-green-100 hover:bg-green-200 text-green-700 px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2">
            🔄 Actualizar
          </button>
          <button onClick={() => navigator.clipboard.writeText(report)}
            className="btn-action bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2">
            📋 Copiar
          </button>
        </div>
      </div>
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-3 sm:p-6 text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-x-auto" style={{ maxHeight: '60vh', lineHeight: 1.5 }}>
        {report}
      </div>
    </section>
  )
}
