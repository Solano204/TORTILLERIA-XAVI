// src/pages/CierreMensual.jsx
import React from 'react'
import { useApp } from '../context/AppContext'
import { fetchSalesFrom } from '../services/dataService'

export default function CierreMensual() {
  const { state, currentUser, showToast } = useApp()

  const generateMonthlyPDF = async () => {
    showToast('Generando reporte PDF profesional...')
    if (!window.html2pdf) return showToast('❌ Librería PDF no encontrada.', 'error')
    if (currentUser?.role !== 'admin') return showToast('No tienes permisos', 'error')

    let totalMensual = 0, transaccionesTotales = 0
    const productSummary = {}, branchSummary = {}

    try {
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      hace30Dias.setHours(0, 0, 0, 0)

      const ventasMes = await fetchSalesFrom(hace30Dias.getTime())
      if (!ventasMes.length) return showToast('No hay datos suficientes este mes', 'error')

      ventasMes.forEach(sale => {
        totalMensual += sale.total
        transaccionesTotales++
        if (!branchSummary[sale.branch]) branchSummary[sale.branch] = { total: 0, count: 0 }
        branchSummary[sale.branch].total += sale.total
        branchSummary[sale.branch].count++
        sale.items.forEach(item => {
          if (!productSummary[item.name]) productSummary[item.name] = { qty: 0, total: 0, type: item.saleType }
          productSummary[item.name].qty += item.qty
          productSummary[item.name].total += item.total
        })
      })
    } catch (e) {
      return showToast('Error de conexión', 'error')
    }

    const promTicket = transaccionesTotales > 0 ? totalMensual / transaccionesTotales : 0
    const promDiario = totalMensual / 30

    let sucursalesHTML = ''
    Object.entries(branchSummary).sort((a, b) => b[1].total - a[1].total).forEach(([branch, data]) => {
      const users = state.users?.filter(u => u.branch === branch && u.role !== 'admin').map(u => u.username).join(', ') || 'Sin asignar'
      sucursalesHTML += `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 8px;color:#374151;"><div style="font-weight:bold;font-size:14px;">${branch}</div><div style="font-size:11px;color:#6b7280;margin-top:2px;">👤 ${users}</div></td>
        <td style="padding:12px 8px;text-align:center;color:#6b7280;">${data.count}</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;color:#d97706;">$${data.total.toFixed(2)}</td>
      </tr>`
    })

    let productosHTML = ''
    Object.entries(productSummary).sort((a, b) => b[1].total - a[1].total).forEach(([name, data]) => {
      const amt = data.type === 'pieza' ? `${data.qty} Pz` : `${(data.qty / 1000).toFixed(2)} Kg`
      productosHTML += `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px 8px;color:#374151;font-weight:bold;">${name}</td>
        <td style="padding:12px 8px;text-align:center;color:#6b7280;">${amt}</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;color:#059669;">$${data.total.toFixed(2)}</td>
      </tr>`
    })

    const pdfHTML = `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:40px;background:white;color:#333;">
      <div style="text-align:center;border-bottom:4px solid #f59e0b;padding-bottom:20px;margin-bottom:30px;">
        <h1 style="color:#d97706;margin:0;font-size:30px;font-weight:800;text-transform:uppercase;">Xavi Comercializadora</h1>
        <h2 style="color:#4b5563;margin:8px 0 5px 0;font-size:20px;font-weight:600;">Reporte Ejecutivo Mensual</h2>
        <p style="color:#6b7280;margin:0;font-size:11px;">Generado por: ${currentUser?.username} | ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:35px;background:#fffbeb;padding:20px;border-radius:12px;border:1px solid #fde68a;">
        ${[['Ingreso Total', `$${totalMensual.toFixed(2)}`], ['Tickets Totales', transaccionesTotales], ['Promedio Diario', `$${promDiario.toFixed(2)}`], ['Ticket Promedio', `$${promTicket.toFixed(2)}`]].map(([label, val]) => `
          <div style="text-align:center;width:23%;">
            <p style="margin:0;color:#92400e;font-size:10px;font-weight:bold;text-transform:uppercase;">${label}</p>
            <p style="margin:5px 0 0 0;color:#b45309;font-size:24px;font-weight:900;">${val}</p>
          </div>`).join('<div style="border-left:2px dashed #fcd34d;"></div>')}
      </div>
      <h3 style="color:#1f2937;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:15px;">1. Desglose de Ventas por Sucursal</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:35px;font-size:13px;">
        <thead><tr style="background-color:#f3f4f6;">
          <th style="padding:10px 8px;text-align:left;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Sucursal</th>
          <th style="padding:10px 8px;text-align:center;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Tickets</th>
          <th style="padding:10px 8px;text-align:right;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Ingreso Bruto</th>
        </tr></thead>
        <tbody>${sucursalesHTML}</tbody>
      </table>
      <h3 style="color:#1f2937;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:15px;">2. Rendimiento por Producto</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background-color:#f3f4f6;">
          <th style="padding:10px 8px;text-align:left;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Producto</th>
          <th style="padding:10px 8px;text-align:center;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Volumen</th>
          <th style="padding:10px 8px;text-align:right;color:#4b5563;font-weight:bold;border-bottom:2px solid #d1d5db;">Ingreso</th>
        </tr></thead>
        <tbody>${productosHTML}</tbody>
      </table>
      <div style="text-align:center;margin-top:50px;color:#9ca3af;font-size:10px;border-top:1px solid #e5e7eb;padding-top:15px;">
        <p style="margin:0;">Documento generado por el <strong>Sistema Integral Multi-Sucursal Xavi</strong>.</p>
      </div>
    </div>`

    window.html2pdf().set({
      margin: 15, filename: `Reporte_Mensual_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(`<div style="width:700px;">${pdfHTML}</div>`).save()
    showToast('✅ Reporte Mensual descargado con éxito')
  }

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-4xl mx-auto text-center">
      <div className="mb-6">
        <span className="text-6xl mb-4 block">📑</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Reporte Ejecutivo Mensual</h2>
        <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto">Genera un documento PDF formal con el resumen de ganancias de los últimos 30 días, desglosado por sucursal y por rendimiento de productos.</p>
      </div>
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 max-w-md mx-auto mb-6 shadow-inner">
        <p className="text-amber-800 font-bold mb-4">¿Qué incluye este reporte?</p>
        <ul className="text-sm text-amber-700 text-left space-y-2 mb-6">
          <li>✅ Ingreso Bruto Global (Últimos 30 días).</li>
          <li>✅ Transacciones y Ticket Promedio.</li>
          <li>✅ Desglose exacto de ventas por cada Sucursal.</li>
          <li>✅ Top de Productos más vendidos.</li>
        </ul>
        <button onClick={generateMonthlyPDF}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2">
          📄 Descargar PDF Ahora
        </button>
      </div>
    </section>
  )
}
