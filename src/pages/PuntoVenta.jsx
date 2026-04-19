// src/pages/PuntoVenta.jsx
import React, { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import ProductModal from '../components/ProductModal'
import QuantityModal from '../components/QuantityModal'
import TicketModal from '../components/TicketModal'
import { savePartial, saveSale } from '../services/dataService'
import { generateHTMLTicket, sendWhatsApp } from '../utils/helpers'

export default function PuntoVenta() {
  const { state, updateState, currentUser, showToast } = useApp()
  const isAdmin = currentUser?.role === 'admin'

  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showQtyModal, setShowQtyModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showTicket, setShowTicket] = useState(false)
  const [ticketHTML, setTicketHTML] = useState('')
  const [payment, setPayment] = useState('')
  const [productsOpen, setProductsOpen] = useState(true)
  const [customMoney, setCustomMoney] = useState('')
  const [selectedFlour, setSelectedFlour] = useState('')

  // Filtered products per branch
  const visibleProducts = isAdmin
    ? state.products
    : state.products.filter(p => p.branches?.includes(currentUser.branch))

  const cartTotal = state.cart.reduce((s, i) => s + i.total, 0)
  const paymentVal = parseFloat(payment) || 0
  const change = paymentVal > cartTotal ? paymentVal - cartTotal : 0

  // --- Product CRUD ---
  const handleSaveProduct = async (form) => {
    const id = editingProduct?.id
    let products
    if (id) {
      products = state.products.map(p => p.id === id ? { ...p, ...form, stocks: p.stocks || {} } : p)
    } else {
      const newId = Date.now()
      const newP = { id: newId, ...form, stocks: {} }
      form.branches?.forEach(b => { if (newP.stocks[b] === undefined) newP.stocks[b] = 0 })
      products = [...state.products, newP]
    }
    updateState({ products })
    await savePartial({ products })
    showToast('Producto guardado')
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    const products = state.products.filter(p => p.id !== id)
    updateState({ products })
    await savePartial({ products })
    showToast('Producto eliminado', 'error')
  }

  // --- Cart ---
  const addToCart = useCallback((product, qty) => {
    const total = product.saleType === 'kg' ? (qty / 1000) * product.price : qty * product.price
    const item = { productId: product.id, name: product.name, emoji: product.emoji, saleType: product.saleType, qty, price: product.price, total }
    updateState({ cart: [...state.cart, item] })
  }, [state.cart, updateState])

  const addOnePiece = (product) => {
    const qtyInCart = state.cart.filter(i => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
    const stock = product.stocks?.[currentUser.branch] ?? product.stock ?? 0
    if (qtyInCart + 1 > stock) return showToast(`❌ Stock agotado: Solo tienes ${stock} de ${product.name}`, 'error')
    addToCart(product, 1)
    showToast(`+1 ${product.name} agregado`)
  }

  const handleProductClick = (product) => {
    if (isAdmin) return
    const isOutOfStock = product.saleType === 'pieza' && (product.stocks?.[currentUser.branch] ?? product.stock ?? 0) <= 0
    if (isOutOfStock) return showToast('❌ Producto agotado en tu sucursal', 'error')
    if (product.saleType === 'pieza') { addOnePiece(product) }
    else { setSelectedProduct(product); setShowQtyModal(true) }
  }

  const removeFromCart = (idx) => {
    const cart = state.cart.filter((_, i) => i !== idx)
    updateState({ cart })
  }

  const clearCart = () => { updateState({ cart: [] }); setPayment('') }

  // --- Quick sale ---
  const quickSaleByMoney = (amount) => {
    const select = document.getElementById('quick-sale-select')
    const product = state.products.find(p => p.id === parseInt(select?.value)) || visibleProducts[0]
    if (!product) return showToast('No hay productos', 'error')
    let qty, total
    if (product.saleType === 'pieza') {
      qty = Math.floor(amount / product.price)
      if (qty < 1) return showToast(`$${amount} no alcanza para 1 pieza`, 'error')
      const inCart = state.cart.filter(i => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
      const stock = product.stocks?.[currentUser.branch] ?? product.stock ?? 0
      if (inCart + qty > stock) return showToast(`❌ No hay stock suficiente (Disponibles: ${stock})`, 'error')
      total = qty * product.price
    } else {
      qty = Math.round((amount / product.price) * 1000)
      total = amount
    }
    updateState({ cart: [...state.cart, { productId: product.id, name: product.name, emoji: product.emoji, saleType: product.saleType, qty, price: product.price, total }] })
    showToast('Agregado al carrito')
  }

  const quickSaleCustom = () => {
    const amount = parseFloat(customMoney)
    if (!amount || amount <= 0) return showToast('Monto inválido', 'error')
    quickSaleByMoney(amount)
    setCustomMoney('')
  }

  // --- Complete sale ---
  const completeSale = async () => {
    if (state.cart.length === 0) return showToast('Carrito vacío', 'error')
    const total = cartTotal
    const kilosVendidos = state.cart.reduce((s, i) => i.saleType === 'kg' ? s + i.qty / 1000 : s, 0)

    let newInventory = { ...state.inventory }
    if (kilosVendidos > 0) {
      let inv = { ...(newInventory[currentUser.branch] || { maseca: 0, blanca: 0, amarilla: 0, fardo: 0, yieldRemainingKg: 0 }) }
      const bultosNecesarios = kilosVendidos / 41
      const totalBultos = (inv.maseca || 0) + (inv.blanca || 0) + (inv.amarilla || 0) + (inv.fardo || 0)
      if (totalBultos < bultosNecesarios) {
        const msg = `*ALERTA CRÍTICA DE INVENTARIO* 🚨\nSucursal: ${currentUser.branch}\nUsuario: ${currentUser.username}\nHora: ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\nSe intentó vender *${kilosVendidos.toFixed(2)} Kg* pero el inventario no alcanza.\n⚠️ *VENTA BLOQUEADA.*`
        sendWhatsApp(msg)
        return showToast('❌ Venta denegada: Inventario insuficiente', 'error')
      }
      let remaining = bultosNecesarios
      const flourTypes = ['maseca', 'blanca', 'amarilla', 'fardo']
      while (remaining > 0.0001) {
        flourTypes.sort((a, b) => (inv[b] || 0) - (inv[a] || 0))
        const h = flourTypes[0]
        if (inv[h] >= remaining) { inv[h] -= remaining; remaining = 0 }
        else { remaining -= inv[h]; inv[h] = 0 }
      }
      inv.yieldRemainingKg -= kilosVendidos
      newInventory[currentUser.branch] = inv
    }

    const now = new Date()
    const newSale = {
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      total, items: state.cart.map(i => ({ productId: i.productId, name: i.name, emoji: i.emoji, saleType: i.saleType, qty: i.qty, price: i.price, total: i.total })),
      timestamp: now.getTime(), user: currentUser.username, branch: currentUser.branch, dateString: now.toDateString()
    }

    // Update piece stocks
    let newProducts = state.products.map(p => {
      const item = state.cart.find(c => c.productId === p.id && c.saleType === 'pieza')
      if (!item) return p
      const stocks = { ...(p.stocks || {}) }
      const cur = stocks[currentUser.branch] ?? p.stock ?? 0
      stocks[currentUser.branch] = cur - item.qty
      return { ...p, stocks }
    })

    try {
      await saveSale(newSale)
      await savePartial({ inventory: newInventory, products: newProducts })
      updateState({ cart: [], inventory: newInventory, products: newProducts, salesHistory: [...state.salesHistory, newSale] })
      setPayment('')
      setSelectedFlour('')
      showToast(`Venta procesada: $${total.toFixed(2)}`)
    } catch (err) {
      console.error(err)
      showToast('Error al procesar venta', 'error')
    }
  }

  // --- Ticket ---
  const generateTicket = () => {
    if (state.cart.length === 0) return showToast('Carrito vacío', 'error')
    const now = new Date()
    const html = generateHTMLTicket(
      state.businessName, currentUser.branch, currentUser.username,
      now.toLocaleDateString('es-MX'), now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      state.cart, cartTotal, paymentVal
    )
    setTicketHTML(html)
    setShowTicket(true)
  }

  // Check out-of-stock for display
  const isOutOfStock = (p) => !isAdmin && p.saleType === 'pieza' && (p.stocks?.[currentUser?.branch] ?? p.stock ?? 0) <= 0

  const colorMap = { amber: 'amber', yellow: 'yellow', orange: 'orange', blue: 'blue', green: 'green', red: 'red', purple: 'purple' }

  return (
    <div id="tab-punto-venta">
      <div className={`flex flex-col ${isAdmin ? '' : 'lg:grid lg:grid-cols-3'} gap-4 sm:gap-6`}>

        {/* LEFT PANEL */}
        <div className={`flex flex-col gap-4 sm:gap-6 order-2 lg:order-1 ${isAdmin ? '' : 'lg:col-span-2'}`}>

          {/* Products section */}
          <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => setProductsOpen(o => !o)}>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                  <span className="text-xl sm:text-2xl">📦</span> Productos
                </h2>
                <span className={`text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:bg-amber-100 group-hover:text-amber-600 text-xs ${productsOpen ? '' : 'rotate-[-90deg]'}`}>▼</span>
              </div>
              {isAdmin && (
                <button onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
                  className="btn-action bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-md">
                  <span>➕</span> Nuevo
                </button>
              )}
            </div>
            {productsOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-2">
                {visibleProducts.length === 0
                  ? <p className="col-span-full text-gray-400 text-center py-8">No hay productos.</p>
                  : visibleProducts.map(product => {
                    const oos = isOutOfStock(product)
                    const c = product.color || 'amber'
                    const visual = product.image
                      ? <img src={product.image} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full shadow-sm mb-1 sm:mb-2 border-2 border-gray-200 bg-white" alt="" />
                      : <div className="text-3xl sm:text-4xl text-center mb-1 sm:mb-2">{product.emoji}</div>
                    const unitLabel = product.saleType === 'pieza' ? 'Pz' : product.saleType === 'litro' ? 'L' : 'Kg'
                    return (
                      <div key={product.id}
                        className={`product-card bg-gradient-to-br from-${c}-100 to-${c}-50 rounded-xl p-3 sm:p-4 cursor-pointer transition-all border-2 border-${c}-200 hover:border-${c}-400 hover:shadow-lg relative group flex flex-col items-center justify-center ${oos ? 'opacity-50 grayscale' : ''}`}
                        onClick={() => handleProductClick(product)}>
                        {isAdmin && (
                          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <button onClick={e => { e.stopPropagation(); setEditingProduct(product); setShowProductModal(true) }}
                              className="bg-white/80 hover:bg-white p-1 sm:p-2 rounded-lg text-xs shadow-sm">✏️</button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteProduct(product.id) }}
                              className="bg-white/80 hover:bg-red-100 p-1 sm:p-2 rounded-lg text-xs shadow-sm">🗑️</button>
                          </div>
                        )}
                        {oos && (
                          <>
                            <div className="absolute inset-0 bg-white/20 z-20 rounded-xl" />
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded shadow-lg z-30 uppercase rotate-[-10deg]">Agotado</span>
                          </>
                        )}
                        {visual}
                        <h3 className="font-bold text-gray-800 text-center text-xs sm:text-sm leading-tight">{product.name}</h3>
                        <p className={`text-${c}-600 font-bold text-center text-xs sm:text-sm mt-1`}>${product.price.toFixed(2)}/{unitLabel}</p>
                      </div>
                    )
                  })
                }
              </div>
            )}
          </section>

          {/* Quick sale section (employees only) */}
          {!isAdmin && (
            <section className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2"><span className="text-xl sm:text-2xl">💵</span> Venta Rápida</h2>
              <div className="mb-4">
                <label className="text-xs sm:text-sm font-semibold opacity-90 mb-1 block">Producto:</label>
                <select id="quick-sale-select"
                  className="w-full bg-white/20 backdrop-blur text-white border-2 border-white/30 rounded-xl px-3 py-2 text-sm focus:border-white focus:outline-none cursor-pointer">
                  {visibleProducts.map(p => {
                    const label = p.saleType === 'pieza' ? 'Pz' : 'Kg'
                    return <option key={p.id} value={p.id} className="text-gray-800 bg-white">{p.emoji} {p.name} (${p.price}/{label})</option>
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[5, 10, 20, 50].map(amount => (
                  <button key={amount} onClick={() => quickSaleByMoney(amount)}
                    className="btn-action bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-3 sm:p-4 text-center transition-all">
                    <p className="text-xl sm:text-2xl font-bold">${amount}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input type="number" value={customMoney} onChange={e => setCustomMoney(e.target.value)}
                  placeholder="Monto a cobrar"
                  className="flex-1 bg-white/20 backdrop-blur rounded-xl px-4 py-3 placeholder-white/60 text-white border-2 border-white/30 focus:border-white focus:outline-none text-sm sm:text-base" />
                <button onClick={quickSaleCustom}
                  className="btn-action bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all text-sm sm:text-base">Agregar</button>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT PANEL - Cart (employees only) */}
        {!isAdmin && (
          <div className="w-full flex flex-col order-1 lg:order-2">
            <section className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2"><span className="text-xl sm:text-2xl">🛒</span> Venta Actual</h2>
              </div>
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-[120px] max-h-[250px] sm:max-h-[350px] overflow-y-auto">
                {state.cart.length === 0
                  ? <p className="text-gray-400 text-sm text-center py-6">Carrito vacío</p>
                  : state.cart.map((item, idx) => {
                    const desc = item.saleType === 'pieza'
                      ? `${item.qty} pz × $${item.price.toFixed(2)}/Pz`
                      : `${item.qty}g × $${item.price.toFixed(2)}/Kg`
                    return (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-2 sm:p-3 animate-slide">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl">{item.emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">{item.name}</p>
                            <p className="text-gray-500 text-[10px] sm:text-xs">{desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-bold text-gray-800 text-sm sm:text-base">${item.total.toFixed(2)}</span>
                          <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 p-2 text-lg leading-none">&times;</button>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm sm:text-base text-gray-600 font-semibold">Subtotal:</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-800">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-xl sm:text-2xl">
                  <span className="font-bold text-gray-800">TOTAL:</span>
                  <span className="font-bold text-blue-600">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <input type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="Pago del cliente"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-base sm:text-lg focus:border-blue-500 focus:outline-none" />
                  {paymentVal > 0 && paymentVal >= cartTotal && (
                    <div className="bg-green-100 border-2 border-green-300 rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-xs sm:text-sm text-green-600">Cambio a entregar:</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">${change.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                {/* Flour selector - shown if cart has kg products */}
                {state.cart.some(i => i.saleType === 'kg') && (
                  <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <label className="text-xs sm:text-sm font-bold text-amber-800 block mb-1">🌾 Harina en uso:</label>
                    <select value={selectedFlour} onChange={e => setSelectedFlour(e.target.value)}
                      className="w-full border-2 border-amber-300 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none bg-white font-semibold text-gray-700">
                      <option value="">-- Selecciona una opción --</option>
                      <option value="maseca">Maseca Premium</option>
                      <option value="blanca">Harimasa Blanca</option>
                      <option value="amarilla">Harimasa Amarilla</option>
                      <option value="fardo">Harimasa Fardo</option>
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <button onClick={clearCart}
                    className="btn-action bg-red-100 hover:bg-red-200 text-red-600 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-1">
                    🗑️ <span className="hidden sm:inline">Limpiar</span>
                  </button>
                  <button onClick={generateTicket}
                    className="btn-action bg-purple-500 hover:bg-purple-600 text-white py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-1">
                    🎫 <span className="hidden sm:inline">Ticket</span>
                  </button>
                </div>
                <button onClick={completeSale}
                  className="btn-action w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all mt-3 shadow-md">
                  ✅ Completar Venta
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal show={showProductModal} onClose={() => { setShowProductModal(false); setEditingProduct(null) }} onSave={handleSaveProduct} editingProduct={editingProduct} />
      <QuantityModal show={showQtyModal} onClose={() => setShowQtyModal(false)} product={selectedProduct} onAdd={addToCart} />
      <TicketModal show={showTicket} onClose={() => setShowTicket(false)} ticketHTML={ticketHTML} />
    </div>
  )
}
