// src/pages/VentasDia.jsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import TicketModal from '../components/TicketModal'
import { deleteSale, savePartial } from '../services/dataService'
import { generateHTMLTicket, getVisibleSales } from '../utils/helpers'

export default function VentasDia() {
  const { state, updateState, currentUser, showToast, selectedFilterDate } = useApp()
  const isAdmin = currentUser?.role === 'admin'
  const [ticketHTML, setTicketHTML] = useState('')
  const [showTicket, setShowTicket] = useState(false)

  const visibleSales = getVisibleSales(state.salesHistory, currentUser)
  const dailyTotal = visibleSales.reduce((s, sale) => s + sale.total, 0)

  const showHistoricSale = (timestamp) => {
    const sale = state.salesHistory.find(s => s.timestamp === timestamp)
    if (!sale) return
    const d = new Date(timestamp)
    const html = generateHTMLTicket(
      state.businessName, sale.branch, sale.user,
      d.toLocaleDateString('es-MX'), sale.time,
      sale.items, sale.total, 0, timestamp
    )
    setTicketHTML(html)
    setShowTicket(true)
  }

  const deleteIndividualSale = async (timestamp) => {
    if (!isAdmin) return showToast('No tienes permisos', 'error')
    if (!confirm('¿Eliminar este ticket? El inventario regresará al almacén.')) return

    const saleToDelete = state.salesHistory.find(s => s.timestamp === timestamp)
    let newInventory = { ...state.inventory }
    let newProducts = state.products.map(p => ({ ...p }))

    if (saleToDelete) {
      // Restore kg inventory
      const kilosRestaurar = saleToDelete.items.reduce((s, i) => i.saleType === 'kg' ? s + i.qty / 1000 : s, 0)
      if (kilosRestaurar > 0) {
        const inv = { ...(newInventory[saleToDelete.branch] || { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 }) }
        const bultosRestaurar = kilosRestaurar / 41
        inv.yieldRemainingKg += kilosRestaurar
        const flourTypes = ['maseca', 'blanca', 'amarilla', 'fardo']
        flourTypes.sort((a, b) => (inv[b] || 0) - (inv[a] || 0))
        inv[flourTypes[0]] = (inv[flourTypes[0]] || 0) + bultosRestaurar
        newInventory[saleToDelete.branch] = inv
      }
      // Restore piece stocks
      saleToDelete.items.forEach(item => {
        if (item.saleType === 'pieza') {
          const idx = newProducts.findIndex(p => p.id === item.productId)
          if (idx !== -1) {
            const p = { ...newProducts[idx], stocks: { ...(newProducts[idx].stocks || {}) } }
            p.stocks[saleToDelete.branch] = (p.stocks[saleToDelete.branch] ?? p.stock ?? 0) + item.qty
            newProducts[idx] = p
          }
        }
      })
    }

    try {
      await deleteSale(timestamp)
      await savePartial({ inventory: newInventory, products: newProducts })
      updateState({
        salesHistory: state.salesHistory.filter(s => s.timestamp !== timestamp),
        inventory: newInventory, products: newProducts
      })
      showToast('Venta eliminada e inventario restaurado')
    } catch (err) {
      console.error(err)
      showToast('Error al borrar de la nube', 'error')
    }
  }

  const clearDailySales = async () => {
    if (!isAdmin) return showToast('No tienes permisos', 'error')
    const fechaTexto = selectedFilterDate ? new Date(selectedFilterDate).toLocaleDateString('es-MX') : 'HOY'
    if (!confirm(`¿Limpiar TODAS las ventas del día: ${fechaTexto}? Se borrará permanentemente y el inventario regresará al almacén.`)) return

    showToast('Eliminando tickets en la nube, espera...')
    let newInventory = { ...state.inventory }
    let newProducts = state.products.map(p => ({ ...p, stocks: { ...(p.stocks || {}) } }))

    for (const sale of state.salesHistory) {
      const kilosRestaurar = sale.items.reduce((s, i) => i.saleType === 'kg' ? s + i.qty / 1000 : s, 0)
      if (kilosRestaurar > 0) {
        const inv = { ...(newInventory[sale.branch] || { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 }) }
        const bultosRestaurar = kilosRestaurar / 41
        inv.yieldRemainingKg += kilosRestaurar
        const flourTypes = ['maseca', 'blanca', 'amarilla', 'fardo']
        flourTypes.sort((a, b) => (inv[b] || 0) - (inv[a] || 0))
        inv[flourTypes[0]] = (inv[flourTypes[0]] || 0) + bultosRestaurar
        newInventory[sale.branch] = inv
      }
      sale.items.forEach(item => {
        if (item.saleType === 'pieza') {
          const idx = newProducts.findIndex(p => p.id === item.productId)
          if (idx !== -1) {
            const p = newProducts[idx]
            const stocks = { ...(p.stocks || {}) }
            stocks[sale.branch] = (stocks[sale.branch] ?? p.stock ?? 0) + item.qty
            newProducts[idx] = { ...p, stocks }
          }
        }
      })
      try { await deleteSale(sale.timestamp) } catch (e) { console.error(e) }
    }

    await savePartial({ inventory: newInventory, products: newProducts })
    updateState({ salesHistory: [], inventory: newInventory, products: newProducts })
    showToast(`Se eliminaron todas las ventas del día ${fechaTexto}`)
  }

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b pb-4 border-gray-100">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🧾</span>
          Historial de Ventas de Hoy (<span className="text-blue-600">{isAdmin ? 'Global' : currentUser?.branch}</span>)
        </h2>
        {isAdmin && (
          <button onClick={clearDailySales}
            className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold border border-red-200 transition-colors shadow-sm">
            🗑️ Limpiar todo
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
        {[...visibleSales].reverse().map((sale, index) => (
          <div key={sale.timestamp} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 sm:p-3 text-xs sm:text-sm hover:bg-gray-100 group">
            <div className="cursor-pointer flex-1" onClick={() => showHistoricSale(sale.timestamp)}>
              <span className="text-gray-500 font-bold">#{visibleSales.length - index}</span>
              <span className="text-gray-400 ml-1 sm:ml-2">{sale.time}</span>
              <span className="text-[9px] sm:text-[10px] ml-1 font-bold text-amber-600 block sm:inline">({sale.branch})</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-bold text-green-600 cursor-pointer text-sm sm:text-base" onClick={() => showHistoricSale(sale.timestamp)}>
                ${sale.total.toFixed(2)}
              </span>
              {isAdmin && (
                <button onClick={() => deleteIndividualSale(sale.timestamp)}
                  className="text-red-400 hover:text-red-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-2 sm:p-1">
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
        {visibleSales.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin ventas hoy</p>}
      </div>

      <div className="mt-4 pt-4 flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <span className="text-sm sm:text-base text-gray-600 font-bold uppercase tracking-wider">Corte total de hoy:</span>
        <span className="text-2xl sm:text-4xl font-black text-green-600">${dailyTotal.toFixed(2)}</span>
      </div>

      <TicketModal show={showTicket} onClose={() => setShowTicket(false)} ticketHTML={ticketHTML}
        title="🎫 Detalles de Venta" gradientClass="from-indigo-500 to-blue-500" />
    </section>
  )
}
