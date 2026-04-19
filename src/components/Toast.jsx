// src/components/Toast.jsx
import React from 'react'
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto px-5 sm:px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 z-[300] text-center sm:text-left text-sm sm:text-base font-semibold text-white
      ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
      ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
      {toast.message}
    </div>
  )
}
