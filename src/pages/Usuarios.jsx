// src/pages/Usuarios.jsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import UserModal from '../components/UserModal'
import { savePartial } from '../services/dataService'
import Modal from '../components/Modal'

export default function Usuarios() {
  const { state, updateState, currentUser, showToast } = useApp()
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showNormModal, setShowNormModal] = useState(false)
  const [normAliases, setNormAliases] = useState({})
  const [orphanBranches, setOrphanBranches] = useState([])

  const currentBranches = [...new Set(state.users.map(u => u.branch))].filter(b => b && b !== 'Todas')

  const handleSaveUser = async (form) => {
    const id = editingUser?.id
    let users
    if (id) {
      users = state.users.map(u => u.id === id ? { ...u, ...form } : u)
      showToast('Usuario actualizado')
    } else {
      if (state.users.some(u => u.username.toLowerCase() === form.username.toLowerCase())) {
        return showToast('Usuario ya existe', 'error')
      }
      const newId = state.users.length > 0 ? Math.max(...state.users.map(u => u.id)) + 1 : 1
      users = [...state.users, { id: newId, ...form }]
      showToast('Usuario creado')
    }
    updateState({ users })
    await savePartial({ users })
  }

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar usuario?')) return
    const users = state.users.filter(u => u.id !== id)
    updateState({ users })
    await savePartial({ users })
    showToast('Eliminado')
  }

  // Branch normalization
  const openNormModal = async () => {
    try {
      const { fetchStockEntries } = await import('../services/dataService')
      const logs = await fetchStockEntries()
      const historical = [...new Set([...logs.map(l => l.sucursal), ...state.salesHistory.map(s => s.branch)])].filter(b => b)
      const orphans = historical.filter(b => !currentBranches.includes(b))
      setOrphanBranches(orphans)
      setNormAliases(state.branch_aliases || {})
      setShowNormModal(true)
    } catch (e) {
      showToast('Error cargando historial', 'error')
    }
  }

  const saveNormalization = async () => {
    updateState({ branch_aliases: normAliases })
    await savePartial({ branch_aliases: normAliases })
    setShowNormModal(false)
    showToast('✅ Sucursales consolidadas correctamente')
  }

  return (
    <>
      <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">👤 Control de Usuarios</h2>
          <div className="flex gap-2">
            <button onClick={openNormModal}
              className="btn-action bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2 shadow-md shrink-0">
              🔧 Consolidar Sucursales
            </button>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true) }}
              className="btn-action bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2 shadow-md shrink-0">
              ➕ Nuevo Usuario
            </button>
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b-2 border-gray-200 text-sm">
                <th className="p-3 sm:p-4 font-bold rounded-tl-xl">Usuario</th>
                <th className="p-3 sm:p-4 font-bold">Sucursal Asignada</th>
                <th className="p-3 sm:p-4 font-bold">Contraseña</th>
                <th className="p-3 sm:p-4 font-bold">Rol</th>
                <th className="p-3 sm:p-4 font-bold rounded-tr-xl text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm sm:text-base">
              {state.users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 sm:p-4 font-semibold text-gray-800">{user.username}</td>
                  <td className="p-3 sm:p-4"><span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">{user.branch || 'No asignada'}</span></td>
                  <td className="p-3 sm:p-4 text-gray-500">{user.role === 'admin' ? '••••••••' : user.password}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                    {user.username !== 'Admin'
                      ? <>
                        <button onClick={() => { setEditingUser(user); setShowUserModal(true) }} className="text-blue-500 hover:text-blue-700 p-1 sm:p-2">✏️</button>
                        <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700 p-1 sm:p-2 ml-1">🗑️</button>
                      </>
                      : <span className="text-gray-400 text-xs">Protegido</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <UserModal show={showUserModal} onClose={() => { setShowUserModal(false); setEditingUser(null) }} onSave={handleSaveUser} editingUser={editingUser} />

      {/* Branch Normalization Modal */}
      <Modal show={showNormModal} onClose={() => setShowNormModal(false)} zIndex="z-50">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl text-yellow-500">🔧</span>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800">Consolidar Historial de Sucursales</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Esta herramienta busca nombres de sucursales en tu historial que ya no están asociados a ningún usuario actual.</p>
          <div className="space-y-3">
            {orphanBranches.length === 0
              ? <p className="text-center text-gray-500 py-4 text-sm">Todo está en orden. No hay sucursales desvinculadas.</p>
              : orphanBranches.map(oldName => (
                <div key={oldName} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="font-bold text-gray-700 text-sm">Nombre Antiguo: <span className="font-normal text-red-600">{oldName}</span></p>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-gray-600">Fusionar con:</label>
                    <select value={normAliases[oldName] || ''} onChange={e => setNormAliases(a => ({ ...a, [oldName]: e.target.value || undefined }))}
                      className="flex-1 text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-300">
                      <option value="">-- Mantener separado --</option>
                      {currentBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowNormModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold">Cancelar</button>
            {orphanBranches.length > 0 && (
              <button onClick={saveNormalization} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-xl font-bold">Guardar Consolidación</button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
