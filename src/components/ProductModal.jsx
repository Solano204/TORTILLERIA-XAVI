// src/components/ProductModal.jsx
import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import { compressImage } from '../utils/helpers'

export default function ProductModal({ show, onClose, onSave, editingProduct }) {
  const { state } = useApp()
  const [form, setForm] = useState({ saleType: 'kg', name: '', price: '', emoji: '🫓', color: 'amber', image: '', branches: [] })

  const uniqueBranches = [...new Set(state.users.map(u => u.branch))].filter(b => b && b !== 'Todas')

  useEffect(() => {
    if (show) {
      if (editingProduct) {
        setForm({
          saleType: editingProduct.saleType || 'kg',
          name: editingProduct.name,
          price: editingProduct.price,
          emoji: editingProduct.emoji || '🫓',
          color: editingProduct.color || 'amber',
          image: editingProduct.image || '',
          branches: editingProduct.branches || uniqueBranches,
        })
      } else {
        setForm({ saleType: 'kg', name: '', price: '', emoji: '🫓', color: 'amber', image: '', branches: [...uniqueBranches] })
      }
    }
  }, [show, editingProduct])

  const handleImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const b64 = await compressImage(file)
      setForm(f => ({ ...f, image: b64 }))
    } catch { }
  }

  const toggleBranch = (b) => {
    setForm(f => ({
      ...f,
      branches: f.branches.includes(b) ? f.branches.filter(x => x !== b) : [...f.branches, b]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.branches.length === 0) return alert('Selecciona al menos una sucursal')
    onSave({ ...form, price: parseFloat(form.price) })
    onClose()
  }

  const priceLabel = form.saleType === 'pieza' ? 'Precio por Pieza' : 'Precio por Kg'

  return (
    <Modal show={show} onClose={onClose} zIndex="z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 sm:p-4 rounded-t-2xl flex justify-between items-center shrink-0">
          <h3 className="text-lg sm:text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-semibold">Tipo de Venta</label>
              <select value={form.saleType} onChange={e => setForm(f => ({ ...f, saleType: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 focus:border-amber-500 focus:outline-none bg-white cursor-pointer">
                <option value="kg">Por Kilo (Ej. Masa, Tortillas)</option>
                <option value="pieza">Por Pieza (Ej. Queso, Refresco)</option>
                <option value="litro">Por Litro (Ej. Jugo, Salsas)</option>
              </select>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-semibold">Nombre</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-semibold">{priceLabel}</label>
              <input type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-amber-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs sm:text-sm text-gray-600 font-semibold">Emoji</label>
                <input type="text" maxLength={2} value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-2xl text-center focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm text-gray-600 font-semibold">Imagen</label>
                  {form.image && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold">🗑️ Quitar</button>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" id="img-upload" onChange={handleImage} />
                <label htmlFor="img-upload"
                  className="w-full h-[46px] border-2 border-dashed border-gray-300 rounded-xl mt-1 flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative block">
                  {form.image
                    ? <img src={form.image} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xs text-gray-500 font-semibold">📷 Subir foto</span>
                  }
                </label>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="text-xs sm:text-sm text-gray-600 font-bold mb-2 block">📍 Mostrar en sucursales:</label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2">
                {uniqueBranches.map(b => (
                  <label key={b} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-amber-50 text-sm">
                    <input type="checkbox" checked={form.branches.includes(b)} onChange={() => toggleBranch(b)}
                      className="w-4 h-4 accent-amber-600" />
                    <span className="font-semibold text-gray-700">{b}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-semibold">Color de tarjeta</label>
              <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm focus:border-amber-500 focus:outline-none bg-white">
                <option value="amber">Ámbar</option>
                <option value="yellow">Amarillo</option>
                <option value="orange">Naranja</option>
                <option value="blue">Azul</option>
                <option value="green">Verde</option>
                <option value="red">Rojo</option>
                <option value="purple">Morado</option>
              </select>
            </div>
            <div className="flex gap-2 sm:gap-3 pt-4">
              <button type="button" onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl text-sm font-bold transition-all">Cancelar</button>
              <button type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-bold transition-all">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
