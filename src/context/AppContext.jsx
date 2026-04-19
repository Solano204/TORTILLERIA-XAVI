// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    businessName: 'Tortillería El Maíz Dorado',
    products: [],
    cart: [],
    salesHistory: [],
    weeklyHistory: [],
    users: [],
    inventory: {},
    branch_aliases: {},
  })

  const [currentUser, setCurrentUser] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const [selectedFilterDate, setSelectedFilterDate] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }, [])

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <AppContext.Provider value={{
      state, setState, updateState,
      currentUser, setCurrentUser,
      toast, showToast,
      selectedFilterDate, setSelectedFilterDate,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
