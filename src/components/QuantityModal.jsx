// src/components/QuantityModal.jsx
import React, { useState, useEffect } from 'react'
import Modal from './Modal'

export default function QuantityModal({ show, onClose, product, onAdd }) {
  const [qty, setQty] = useState('')

  useEffect(() => { if (show) setQty('') }, [show])

  if (!product) return null
  const isKg = product.saleType === 'kg'
  const val = parseFloat(qty) || 0
  const total = isKg ? (val / 1000) * product.price : val * product.price

  const handleAdd = () => {
    if (val <= 0) return
    onAdd(product, val)
    onClose()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 sm:p-4 rounded-t-2xl">
          <h3 className="text-lg sm:text-xl font-bold">Agregar al Carrito</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="text-center mb-2 sm:mb-4">
            <h4 className="text-lg font-bold text-gray-800">{product.name}</h4>
            <p className="text-sm sm:text-base text-gray-600">
              Precio: <span className="font-bold text-lg sm:text-xl">${product.price.toFixed(2)}</span>
            </p>
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600 font-semibold block mb-1">
              {isKg ? 'Gramos a vender:' : 'Cantidad (piezas):'}
            </label>
            <input
              type="number" value={qty} onChange={e => setQty(e.target.value)}
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-lg sm:text-xl text-center focus:border-blue-500 focus:outline-none"
              placeholder={isKg ? '500' : '1'}
            />
          </div>
          {isKg ? (
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {[250, 500, 1000, 2000].map(v => (
                <button key={v} type="button" onClick={() => setQty(String(v))}
                  className="bg-gray-100 hover:bg-gray-200 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors">
                  {v >= 1000 ? `${v / 1000}Kg` : `${v}g`}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {[1, 2, 3, 5].map(v => (
                <button key={v} type="button" onClick={() => setQty(String(v))}
                  className="bg-gray-100 hover:bg-gray-200 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors">
                  +{v} Pz
                </button>
              ))}
            </div>
          )}
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center mt-2">
            <p className="text-xs sm:text-sm text-blue-600 mb-1">Total a cobrar:</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">${total.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-xl text-sm font-bold transition-all">Cancelar</button>
            <button type="button" onClick={handleAdd}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 sm:py-3 rounded-xl text-sm font-bold transition-all">Agregar</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
