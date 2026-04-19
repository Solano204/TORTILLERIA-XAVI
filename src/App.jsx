// src/App.jsx
import React, { useEffect, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Login from './pages/Login'
import Header from './components/Header'
import TabsNav from './components/TabsNav'
import Toast from './components/Toast'
import PuntoVenta from './pages/PuntoVenta'
import VentasDia from './pages/VentasDia'
import Almacen from './pages/Almacen'
import InventarioProductos from './pages/InventarioProductos'
import RegistroEntradas from './pages/RegistroEntradas'
import ReporteDiario from './pages/ReporteDiario'
import ReporteSemanal from './pages/ReporteSemanal'
import Estadisticas from './pages/Estadisticas'
import Usuarios from './pages/Usuarios'
import Calendario from './pages/Calendario'
import CierreMensual from './pages/CierreMensual'
import {
  loadSystemData, subscribeToSystem, subscribeToTodaySales
} from './services/dataService'

function AppContent() {
  const { state, updateState, currentUser, setCurrentUser, showToast } = useApp()
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('Conectando a la nube...')
  const [activeTab, setActiveTab] = useState('punto-venta')
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    let unsubSystem, unsubSales

    const init = async () => {
      try {
        setLoadingMsg('Conectando a la nube...')
        const data = await loadSystemData()
        updateState(data)

        // Check if we got real data or fallback
        if (!data || (!data.products?.length && !data.users?.length)) {
          setIsOffline(true)
          showToast('⚠️ Modo sin conexión — datos en caché', 'error')
        }

        // Restore saved session
        try {
          const savedSession = localStorage.getItem('pos_current_user')
          if (savedSession) {
            const parsed = JSON.parse(savedSession)
            const userInDB = data.users?.find(
              u => u.username === parsed.username && u.password === parsed.password
            )
            if (userInDB) setCurrentUser(userInDB)
          }
        } catch (e) {
          console.warn('Session restore failed:', e)
        }

        // Subscribe to realtime updates — errors are handled inside dataService
        unsubSystem = subscribeToSystem((snap) => {
          if (!snap.exists()) return
          const d = snap.data()
          const updates = {}
          if (d.inventory) updates.inventory = d.inventory
          if (d.users) updates.users = d.users
          if (d.branch_aliases) updates.branch_aliases = d.branch_aliases
          if (d.products) {
            updates.products = d.products.map(p => ({
              ...p,
              price: p.price !== undefined ? p.price : p.pricePerKg,
              saleType: p.saleType || 'kg',
            }))
          }
          if (Object.keys(updates).length) updateState(updates)
          setIsOffline(false)
        })

        unsubSales = subscribeToTodaySales((snapshot) => {
          const sales = snapshot.docs
            .map(d => d.data())
            .sort((a, b) => a.timestamp - b.timestamp)
          updateState({ salesHistory: sales })
        })

      } catch (e) {
        console.error('Init error:', e)
        showToast('Sin conexión — revisa tu internet', 'error')
        setIsOffline(true)
      } finally {
        // Always hide loading screen no matter what
        setLoading(false)
      }
    }

    init()

    // Listen to browser online/offline events
    const handleOnline = () => {
      setIsOffline(false)
      showToast('✅ Conexión restaurada')
    }
    const handleOffline = () => {
      setIsOffline(true)
      showToast('⚠️ Sin conexión a internet', 'error')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubSystem?.()
      unsubSales?.()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleTabChange = (tab) => setActiveTab(tab)

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('pos_current_user')
    updateState({ cart: [] })
    setActiveTab('punto-venta')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl animate-bounce">🌽</div>
        <h2 className="text-xl sm:text-2xl font-bold text-amber-600">{loadingMsg}</h2>
        <p className="text-sm text-gray-400">Esto puede tomar unos segundos...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Login />
        <Toast />
      </>
    )
  }

  return (
    <div className="h-full overflow-auto flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center text-xs sm:text-sm font-bold py-1 px-4 shrink-0">
          ⚠️ Sin conexión — los cambios se guardarán al reconectar
        </div>
      )}

      <Header onLogout={handleLogout} />
      <TabsNav activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 overflow-x-hidden overflow-y-auto max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 no-print">
        {activeTab === 'punto-venta'        && <PuntoVenta />}
        {activeTab === 'ventas-dia'         && <VentasDia />}
        {activeTab === 'almacen'            && <Almacen />}
        {activeTab === 'inventario-productos' && <InventarioProductos />}
        {activeTab === 'registro-entradas'  && <RegistroEntradas />}
        {activeTab === 'reporte-diario'     && <ReporteDiario />}
        {activeTab === 'reporte-semanal'    && <ReporteSemanal />}
        {activeTab === 'estadisticas'       && <Estadisticas />}
        {activeTab === 'usuarios'           && <Usuarios />}
        {activeTab === 'calendario'         && <Calendario />}
        {activeTab === 'mensual'            && <CierreMensual />}
      </main>

      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}