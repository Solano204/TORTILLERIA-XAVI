// src/pages/Almacen.jsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { savePartial } from '../services/dataService'

export default function Almacen() {
  const { state, updateState, currentUser, showToast } = useApp()
  const isAdmin = currentUser?.role === 'admin'

  const [form, setForm] = useState({ branch: '', maseca: '', blanca: '', amarilla: '', fardo: '' })

  const uniqueBranches = [...new Set(state.users.map(u => u.branch))].filter(b => b && b !== 'Todas')
  const branchesToRender = isAdmin ? uniqueBranches : [currentUser.branch]

  const enviarHarina = async () => {
    if (!form.branch) return showToast('Selecciona una sucursal destino', 'error')
    const maseca = parseInt(form.maseca) || 0
    const blanca = parseInt(form.blanca) || 0
    const amarilla = parseInt(form.amarilla) || 0
    const fardo = parseInt(form.fardo) || 0
    const total = maseca + blanca + amarilla + fardo
    if (total <= 0) return showToast('Debes enviar al menos 1 bulto', 'error')

    const newInventory = { ...state.inventory }
    if (!newInventory[form.branch]) newInventory[form.branch] = { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 }
    newInventory[form.branch] = {
      ...newInventory[form.branch],
      maseca: (newInventory[form.branch].maseca || 0) + maseca,
      blanca: (newInventory[form.branch].blanca || 0) + blanca,
      amarilla: (newInventory[form.branch].amarilla || 0) + amarilla,
      fardo: (newInventory[form.branch].fardo || 0) + fardo,
      yieldRemainingKg: (newInventory[form.branch].yieldRemainingKg || 0) + total * 41,
    }
    updateState({ inventory: newInventory })
    await savePartial({ inventory: newInventory })
    setForm({ branch: '', maseca: '', blanca: '', amarilla: '', fardo: '' })
    showToast(`Enviados ${total} bultos a ${form.branch}`)
  }

  const resetInventario = async (branchName) => {
    if (!confirm(`¿Reiniciar a 0 el inventario de ${branchName}?`)) return
    const newInventory = { ...state.inventory, [branchName]: { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 } }
    updateState({ inventory: newInventory })
    await savePartial({ inventory: newInventory })
    showToast('Inventario reiniciado')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {isAdmin && (
        <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📦</span> Enviar Harina a Sucursal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { key: 'branch', label: 'Destino', type: 'select' },
              { key: 'maseca', label: 'Maseca Premium', placeholder: 'Bultos' },
              { key: 'blanca', label: 'Harimasa Blanca', placeholder: 'Bultos' },
              { key: 'amarilla', label: 'Harimasa Amarilla', placeholder: 'Bultos' },
              { key: 'fardo', label: 'Harimasa Fardo', placeholder: 'Bultos' },
            ].map(field => (
              <div key={field.key} className="lg:col-span-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-600 block mb-1">{field.label}</label>
                {field.type === 'select'
                  ? <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none bg-white">
                    <option value="">Seleccione...</option>
                    {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  : <input type="number" min="0" placeholder={field.placeholder} value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                }
              </div>
            ))}
            <div className="lg:col-span-1 flex items-end">
              <button onClick={enviarHarina}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl transition-all shadow-md h-[42px]">
                Enviar Bultos
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📋</span> Inventario Actual
          </h2>
          <p className="text-sm text-gray-500">* Cada bulto rinde 41 Kg de tortilla.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {branchesToRender.map(branchName => {
            const inv = state.inventory[branchName] || { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 }
            const bultosRestantes = (inv.yieldRemainingKg || 0) / 41
            const LIMITE = 3
            const alerta = bultosRestantes <= LIMITE
            const encargado = state.users.filter(u => u.branch === branchName && u.role !== 'admin').map(u => u.username).join(', ') || 'Sin asignar'

            return (
              <div key={branchName} className={`bg-white rounded-2xl border-2 flex flex-col transition-all ${alerta ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-amber-200 shadow-md'}`}>
                <div className={`bg-gradient-to-r ${alerta ? 'from-red-600 to-red-500' : 'from-amber-500 to-orange-500'} p-3 sm:p-4 text-white flex justify-between items-center shrink-0`}>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">{alerta ? '🚨' : '🏢'}</span> {branchName}
                    </h3>
                    <p className={`text-xs ${alerta ? 'text-red-100' : 'text-amber-100'} font-medium ml-8 mt-1`}>👤 {encargado}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => resetInventario(branchName)}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 py-2 text-xs font-bold border border-white/30">
                      🔄 <span className="hidden sm:inline">Reiniciar</span>
                    </button>
                  )}
                </div>
                {alerta && (
                  <div className="bg-red-500 text-white text-xs font-bold px-4 py-2 text-center uppercase tracking-widest animate-pulse">
                    ⚠️ Alerta: Inventario Crítico
                  </div>
                )}
                <div className={`p-4 ${alerta ? 'bg-red-50/30' : 'bg-amber-50/30'} flex-1`}>
                  <div className="space-y-2 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-200 mb-4 shadow-sm">
                    {[['Maseca Premium', inv.maseca], ['Harimasa Blanca', inv.blanca], ['Harimasa Amarilla', inv.amarilla], ['Harimasa Fardo', inv.fardo]].map(([label, val]) => (
                      <p key={label} className="flex justify-between items-center border-b border-gray-100 pb-1.5 last:border-0">
                        <span className="font-semibold text-gray-600">{label}:</span>
                        <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">{Number(val || 0).toFixed(2)} bultos</span>
                      </p>
                    ))}
                  </div>
                  <div className={`${alerta ? 'bg-red-100 border-red-400' : 'bg-amber-100 border-amber-300'} p-3 rounded-xl border-2 text-center`}>
                    <p className={`${alerta ? 'text-red-800' : 'text-amber-800'} text-[10px] sm:text-xs font-bold mb-1 uppercase tracking-wider`}>Rendimiento Estimado</p>
                    <p className={`text-2xl sm:text-3xl font-black ${alerta ? 'text-red-600' : 'text-amber-600'}`}>{(inv.yieldRemainingKg || 0).toFixed(2)} Kg</p>
                    <p className={`text-xs ${alerta ? 'text-red-700' : 'text-amber-700'} font-semibold mt-1`}>~{bultosRestantes.toFixed(2)} bultos</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
