// src/pages/InventarioProductos.jsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { EntradaModal, EditarStockModal } from '../components/StockModal'
import { savePartial, addStockEntry } from '../services/dataService'

export default function InventarioProductos() {
  const { state, updateState, currentUser, showToast } = useApp()
  const [entradaModal, setEntradaModal] = useState({ show: false, product: null, branch: '' })
  const [editarModal, setEditarModal] = useState({ show: false, product: null, branch: '' })

  const uniqueBranches = [...new Set(state.users.map(u => u.branch))].filter(b => b && b !== 'Todas')
  const productosPieza = state.products.filter(p => p.saleType === 'pieza')

  const updateProductStock = async (productId, branch, newStockFn, logEntry) => {
    const newProducts = state.products.map(p => {
      if (p.id !== productId) return p
      const stocks = { ...(p.stocks || {}) }
      if (stocks[branch] === undefined && p.stock !== undefined) {
        const branches = p.branches || uniqueBranches
        branches.forEach(b => { if (stocks[b] === undefined) stocks[b] = p.stock })
      }
      stocks[branch] = newStockFn(stocks[branch] ?? p.stock ?? 0)
      const updated = { ...p, stocks }
      if ('stock' in updated) delete updated.stock
      return updated
    })
    updateState({ products: newProducts })
    await savePartial({ products: newProducts })
    if (logEntry) {
      try { await addStockEntry(logEntry) } catch (e) { console.error(e) }
    }
  }

  const handleEntrada = async (qty) => {
    const { product, branch } = entradaModal
    const now = new Date()
    await updateProductStock(product.id, branch, (cur) => cur + qty, {
      timestamp: now.getTime(), fecha: now.toLocaleDateString('es-MX'), hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      producto: product.name, sucursal: branch, cantidad: qty, tipo: 'Entrada', usuario: currentUser.username
    })
    showToast(`✅ +${qty} piezas en ${branch}`)
  }

  const handleEditar = async (qty) => {
    const { product, branch } = editarModal
    const prevStock = product.stocks?.[branch] ?? product.stock ?? 0
    const now = new Date()
    await updateProductStock(product.id, branch, () => qty, {
      timestamp: now.getTime(), fecha: now.toLocaleDateString('es-MX'), hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      producto: product.name, sucursal: branch, cantidad: qty, tipo: `Ajuste manual (Antes: ${prevStock})`, usuario: currentUser.username
    })
    showToast(`✅ Stock de ${branch} corregido`)
  }

  const generateStockPDF = async () => {
    showToast('Generando reporte PDF...')
    try {
      const { fetchStockEntriesFrom } = await import('../services/dataService')
      const hace30Dias = new Date()
      hace30Dias.setDate(hace30Dias.getDate() - 30)
      hace30Dias.setHours(0, 0, 0, 0)
      const movimientos = await fetchStockEntriesFrom(hace30Dias.getTime())
      movimientos.sort((a, b) => b.timestamp - a.timestamp)

      const aliases = state.branch_aliases || {}
      const resumen = {}
      currentBranches.forEach(b => {
        resumen[b] = {}
        productosPieza.forEach(p => {
          const pb = p.branches || currentBranches
          if (!pb.includes(b)) return
          let s = 0
          if (p.stocks?.[b] !== undefined) s = p.stocks[b]
          else if (p.stock !== undefined) s = p.stock
          resumen[b][p.name] = { entradas: 0, stockActual: s }
        })
      })

      movimientos.forEach(mov => {
        if (mov.tipo !== 'Entrada') return
        const sr = aliases[mov.sucursal] || mov.sucursal
        if (!resumen[sr]) resumen[sr] = {}
        if (!resumen[sr][mov.producto]) resumen[sr][mov.producto] = { entradas: 0, stockActual: 0 }
        resumen[sr][mov.producto].entradas += mov.cantidad
      })

      let resumenHTML = ''
      Object.keys(resumen).sort().forEach(suc => {
        const keys = Object.keys(resumen[suc])
        if (!keys.length) return
        resumenHTML += `<h4 style="color:#1f2937;margin-top:15px;border-bottom:2px solid #d1d5db;padding-bottom:5px;">🏢 ${suc}</h4>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
          <thead><tr style="background-color:#f3f4f6;">
            <th style="padding:8px;text-align:left;border-bottom:1px solid #d1d5db;">Producto</th>
            <th style="padding:8px;text-align:center;border-bottom:1px solid #d1d5db;">Entradas (30d)</th>
            <th style="padding:8px;text-align:right;border-bottom:1px solid #d1d5db;">Stock Actual</th>
          </tr></thead><tbody>`
        keys.sort().forEach(prod => {
          const d = resumen[suc][prod]
          resumenHTML += `<tr style="border-bottom:1px dashed #e5e7eb;">
            <td style="padding:8px;color:#4b5563;font-weight:bold;">${prod}</td>
            <td style="padding:8px;text-align:center;color:#059669;font-weight:bold;">+${d.entradas} pz</td>
            <td style="padding:8px;text-align:right;color:#1d4ed8;font-weight:900;">${d.stockActual} pz</td>
          </tr>`
        })
        resumenHTML += '</tbody></table>'
      })

      let logHTML = ''
      movimientos.slice(0, 100).forEach(mov => {
        const isE = mov.tipo === 'Entrada'
        const color = isE ? '#059669' : '#d97706'
        const sr = aliases[mov.sucursal] || mov.sucursal
        logHTML += `<tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px;font-size:11px;color:#6b7280;">${mov.fecha}<br>${mov.hora}</td>
          <td style="padding:6px;font-size:11px;font-weight:bold;">${sr}</td>
          <td style="padding:6px;font-size:11px;">${mov.producto}</td>
          <td style="padding:6px;font-size:11px;color:${color};"><b>${isE ? '+' : ''}${mov.cantidad}</b><br><span style="font-size:9px;color:#9ca3af;">${mov.tipo}</span></td>
          <td style="padding:6px;font-size:11px;">${mov.usuario}</td>
        </tr>`
      })

      const html = `<div style="font-family:Helvetica,Arial,sans-serif;padding:30px;background:white;color:#333;">
        <div style="text-align:center;border-bottom:4px solid #3b82f6;padding-bottom:15px;margin-bottom:20px;">
          <h1 style="color:#1d4ed8;margin:0;font-size:26px;font-weight:900;">Xavi Comercializadora</h1>
          <h2 style="color:#4b5563;margin:5px 0;font-size:16px;">Reporte de Inventario (Piezas)</h2>
          <p style="color:#6b7280;margin:0;font-size:11px;">Generado: ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')} por ${currentUser.username}</p>
        </div>
        <h3 style="color:#1e3a8a;font-size:16px;margin-bottom:10px;">📊 Entradas Recientes y Stock Actual</h3>
        ${resumenHTML || '<p style="color:#6b7280;font-style:italic;">Sin datos disponibles.</p>'}
        <div style="margin-top:30px;">
          <h3 style="color:#1e3a8a;font-size:16px;margin-bottom:10px;">🕒 Bitácora de Movimientos</h3>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background-color:#e5e7eb;color:#374151;">
              <th style="padding:8px;text-align:left;">Fecha/Hora</th>
              <th style="padding:8px;text-align:left;">Sucursal</th>
              <th style="padding:8px;text-align:left;">Producto</th>
              <th style="padding:8px;text-align:left;">Mov.</th>
              <th style="padding:8px;text-align:left;">Autor</th>
            </tr></thead>
            <tbody>${logHTML || '<tr><td colspan="5" style="text-align:center;padding:10px;">Sin movimientos</td></tr>'}</tbody>
          </table>
        </div>
      </div>`

      if (window.html2pdf) {
        window.html2pdf().set({
          margin: 15, filename: `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(`<div style="width:700px;">${html}</div>`).save()
        showToast('✅ Reporte descargado')
      }
    } catch (e) {
      console.error(e)
      showToast('Error generando PDF', 'error')
    }
  }

  const currentBranches = uniqueBranches

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl sm:text-3xl">📦</span> Control de Inventario (Por Pieza)</h2>
          <p className="text-sm text-gray-500">Solo muestra productos marcados como "Por Pieza"</p>
        </div>
        <button onClick={generateStockPDF}
          className="btn-action bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2 shadow-md shrink-0">
          📄 Descargar Reporte
        </button>
      </div>
      <div className="overflow-x-auto no-scrollbar rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 border-b-2 border-gray-200 text-sm">
              <th className="p-3 font-bold">Producto</th>
              <th className="p-3 font-bold text-center">Precio</th>
              <th className="p-3 font-bold text-center" colSpan={2}>Stock por Sucursal</th>
            </tr>
          </thead>
          <tbody>
            {productosPieza.length === 0
              ? <tr><td colSpan={4} className="text-center text-gray-500 py-6">No hay productos por pieza.</td></tr>
              : productosPieza.map(p => {
                const visual = p.image
                  ? <img src={p.image} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" />
                  : <span className="text-2xl">{p.emoji}</span>
                const productBranches = p.branches || currentBranches
                const assignedBranches = currentBranches.filter(b => productBranches.includes(b))
                const totalStock = assignedBranches.reduce((s, b) => s + (p.stocks?.[b] ?? p.stock ?? 0), 0)

                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 align-top w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white overflow-hidden shrink-0">{visual}</div>
                        <span className="font-bold text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-semibold text-gray-600 align-top pt-6">${p.price.toFixed(2)}</td>
                    <td className="p-3 align-top" colSpan={2}>
                      <details className="group bg-gray-50 rounded-xl border border-gray-200">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-3 text-sm text-gray-700 hover:text-amber-600">
                          <span className="font-bold">📦 Stock Total: {totalStock} pz</span>
                          <span className="transition group-open:rotate-180 text-xs">▼</span>
                        </summary>
                        <div className="p-2 pt-0 max-h-48 overflow-y-auto border-t border-gray-200 mt-2">
                          {assignedBranches.map(b => {
                            const stock = p.stocks?.[b] ?? p.stock ?? 0
                            return (
                              <div key={b} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 mb-1">
                                <span className="text-[10px] sm:text-xs uppercase font-bold text-gray-500">{b}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${stock <= 5 ? 'text-red-600' : 'text-gray-700'}`}>{stock} pz</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => setEditarModal({ show: true, product: p, branch: b })}
                                      className="bg-blue-500 hover:bg-blue-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs shadow-sm">✏️</button>
                                    <button onClick={() => setEntradaModal({ show: true, product: p, branch: b })}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs shadow-sm">➕</button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      <EntradaModal show={entradaModal.show} onClose={() => setEntradaModal(s => ({ ...s, show: false }))}
        onSave={handleEntrada} product={entradaModal.product} branch={entradaModal.branch} />
      <EditarStockModal show={editarModal.show} onClose={() => setEditarModal(s => ({ ...s, show: false }))}
        onSave={handleEditar} product={editarModal.product} branch={editarModal.branch} />
    </section>
  )
}
