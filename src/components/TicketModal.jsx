// src/components/TicketModal.jsx
import React from 'react'
import Modal from './Modal'

export default function TicketModal({ show, onClose, ticketHTML, title = '🎫 Ticket de Venta', gradientClass = 'from-purple-500 to-pink-500' }) {
  const handlePrint = () => window.print()

  return (
    <Modal show={show} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide flex flex-col max-h-[90vh]">
        <div className={`bg-gradient-to-r ${gradientClass} text-white p-3 sm:p-4 rounded-t-2xl flex justify-between items-center shrink-0 no-print`}>
          <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-100 flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: ticketHTML }} className="w-full" />
        </div>
        <div className="p-3 sm:p-4 border-t bg-white shrink-0 rounded-b-2xl no-print">
          <div className="flex gap-2 sm:gap-3">
            <button onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all">Cerrar</button>
            <button onClick={handlePrint}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2">
              🖨️ <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
