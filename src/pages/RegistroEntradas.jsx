// src/pages/RegistroEntradas.jsx
import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { fetchStockEntries, deleteStockEntry, savePartial } from '../services/dataService'

export default function RegistroEntradas() {
  const { state, updateState, currentUser, showToast } = useApp()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await fetchStockEntries()
      data.sort((a, b) => b.timestamp - a.timestamp)
      setLogs(data.slice(0, 150))
    } catch (e) {
      console.error(e)
      showToast('Error al cargar registros', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLogs() }, [])

  const revertirEntrada = async (docId, productName, branchName, qty, tipo) => {
    if (!confirm(`⚠️ ATENCIÓN:\n\n¿Revertir este movimiento de ${productName}?\n\n- Se borrará del historial.\n- El stock se ajustará automáticamente.`)) return

    showToast('Revirtiendo y ajustando stock...')
    try {
      const newProducts = state.products.map(p => {
        if (p.name !== productName) return p
        const stocks = { ...(p.stocks || {}) }
        if (stocks[branchName] === undefined && p.stock !== undefined) stocks[branchName] = p.stock
        const cur = stocks[branchName] || 0
        if (tipo === 'Entrada') {
          stocks[branchName] = Math.max(0, cur - qty)
        } else if (tipo.includes('Ajuste manual')) {
          const match = tipo.match(/Antes: (\d+)/)
          if (match) stocks[branchName] = parseInt(match[1])
        }
        return { ...p, stocks }
      })

      await deleteStockEntry(docId)
      await savePartial({ products: newProducts })
      updateState({ products: newProducts })
      showToast('✅ Movimiento revertido con éxito')
      loadLogs()
    } catch (e) {
      console.error(e)
      showToast('Error al revertir', 'error')
    }
  }

  const aliases = state.branch_aliases || {}

  return (
    <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"><span className="text-2xl sm:text-3xl">📝</span> Registro de Movimientos</h2>
          <p className="text-sm text-gray-500">Historial de entradas y ajustes. Puedes revertir errores aquí.</p>
        </div>
        <button onClick={loadLogs}
          className="btn-action bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          🔄 Actualizar Lista
        </button>
      </div>
      <div className="overflow-x-auto no-scrollbar rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 text-gray-600 border-b-2 border-gray-200 text-sm">
              <th className="p-3 font-bold">Fecha / Hora</th>
              <th className="p-3 font-bold">Sucursal</th>
              <th className="p-3 font-bold">Producto</th>
              <th className="p-3 font-bold">Movimiento</th>
              <th className="p-3 font-bold">Autor</th>
              <th className="p-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400 font-bold animate-pulse">Cargando registros...</td></tr>
              : logs.length === 0
                ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">No hay movimientos registrados.</td></tr>
                : logs.map(log => {
                  const isEntrada = log.tipo === 'Entrada'
                  const sucursalReal = aliases[log.sucursal] || log.sucursal
                  return (
                    <tr key={log.docId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-500">{log.fecha}<br />{log.hora}</td>
                      <td className="p-3 text-sm font-bold text-gray-700 leading-tight">
                        {sucursalReal}
                        {aliases[log.sucursal] && <span className="block text-[9px] text-gray-400 font-normal">(Reg. orig: {log.sucursal})</span>}
                      </td>
                      <td className="p-3 text-sm font-bold text-gray-800">{log.producto}</td>
                      <td className={`p-3 text-sm font-bold ${isEntrada ? 'text-green-600' : 'text-amber-600'}`}>
                        {isEntrada ? '+' : ''}{log.cantidad}
                        <span className="text-[10px] text-gray-500 font-normal block">{log.tipo}</span>
                      </td>
                      <td className="p-3 text-xs text-gray-600 font-semibold">{log.usuario}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => revertirEntrada(log.docId, log.producto, log.sucursal, log.cantidad, log.tipo)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                          🗑️ Revertir
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </section>
  )
}
