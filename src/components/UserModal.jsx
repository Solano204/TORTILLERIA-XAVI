// src/components/UserModal.jsx
import React, { useState, useEffect } from 'react'
import Modal from './Modal'

export default function UserModal({ show, onClose, onSave, editingUser }) {
  const [form, setForm] = useState({ username: '', password: '', branch: '', role: 'empleado' })

  useEffect(() => {
    if (show) {
      if (editingUser) {
        setForm({ username: editingUser.username, password: editingUser.password, branch: editingUser.branch || '', role: editingUser.role })
      } else {
        setForm({ username: '', password: '', branch: '', role: 'empleado' })
      }
    }
  }, [show, editingUser])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.username.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 sm:p-4 rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-bold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm text-gray-600 font-semibold">Nombre de Usuario</label>
            <input type="text" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600 font-semibold">Contraseña</label>
            <input type="text" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600 font-semibold">Sucursal</label>
            <input type="text" required placeholder="Ej: Sucursal Centro" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600 font-semibold">Rol</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-blue-500 focus:outline-none bg-white">
              <option value="empleado">Empleado (Cajero)</option>
              <option value="admin">Administrador (Total)</option>
            </select>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-xl text-sm font-bold transition-all">Cancelar</button>
            <button type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 sm:py-3 rounded-xl text-sm font-bold transition-all">Guardar</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
