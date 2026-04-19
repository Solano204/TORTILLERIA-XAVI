// src/components/Modal.jsx
import React from 'react'

export default function Modal({ show, onClose, children, zIndex = 'z-[150]' }) {
  if (!show) return null
  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center ${zIndex} p-4`}>
      {children}
    </div>
  )
}
