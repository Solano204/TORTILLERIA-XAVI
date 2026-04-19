// src/components/StockModal.jsx
import React, { useState, useEffect } from 'react'
import Modal from './Modal'

export function EntradaModal({ show, onClose, onSave, product, branch }) {
  const [qty, setQty] = useState('')

  useEffect(() => { if (show) setQty('') }, [show])

  const currentStock = product
    ? (product.stocks?.[branch] !== undefined ? product.stocks[branch] : (product.stock || 0))
    : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = parseInt(qty)
    if (isNaN(n) || n <= 0) return
    onSave(n)
    onClose()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide flex flex-col">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-3 sm:p-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-lg font-bold">🚚 Registrar Entrada</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="text-center mb-2">
            <h4 className="text-lg font-bold text-gray-800">{product?.emoji} {product?.name} ({branch})</h4>
            <p className="text-sm text-gray-500">Stock actual: <span className="font-bold text-gray-800">{currentStock}</span></p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Cantidad a ingresar (Piezas):</label>
            <input type="number" required min="1" value={qty} onChange={e => setQty(e.target.value)} autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 text-2xl font-bold text-center focus:border-emerald-500 focus:outline-none"
              placeholder="Ej: 24" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold transition-all">Cancelar</button>
            <button type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all">✅ Guardar</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export function EditarStockModal({ show, onClose, onSave, product, branch }) {
  const [qty, setQty] = useState('')

  useEffect(() => { if (show) setQty('') }, [show])

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = parseInt(qty)
    if (isNaN(n) || n < 0) return
    onSave(n)
    onClose()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 sm:p-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-lg font-bold">✏️ Corregir Stock</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="text-center mb-2">
            <h4 className="text-lg font-bold text-gray-800">{product?.name} ({branch})</h4>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Stock Real (Cantidad exacta):</label>
            <input type="number" required min="0" value={qty} onChange={e => setQty(e.target.value)} autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-1 text-2xl font-bold text-center focus:border-blue-500 focus:outline-none"
              placeholder="Ej: 20" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold transition-all">Cancelar</button>
            <button type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all">💾 Guardar</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
