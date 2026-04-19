// src/utils/helpers.js

export function getVisibleSales(salesHistory, currentUser) {
  if (!currentUser) return []
  if (currentUser.role === 'admin') return salesHistory
  return salesHistory.filter(s => s.branch === currentUser.branch)
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Not an image')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 64
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE } }
        else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/webp', 0.3))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export function sendWhatsApp(message) {
  const phone = "529637038597"
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export function generateFolio(timestamp) {
  return Math.floor((timestamp || Date.now()) / 1000).toString().slice(-6)
}

export function generateHTMLTicket(businessName, branch, cajero, fecha, hora, items, total, pagoCliente = 0, timestamp = null) {
  const folio = generateFolio(timestamp)

  let html = `
  <div class="ticket-print bg-white mx-auto text-black" style="width:100%;font-family:'Courier New',Courier,monospace;line-height:1.3;box-sizing:border-box;">
    <img src="https://chicfkbdfqdrrevtrrby.supabase.co/storage/v1/object/public/COMERZIALIZAROA/xavi.jpg" alt="Logo" style="display:block;margin:0 auto 10px auto;max-width:45mm;height:auto;">
    <div style="text-align:center;margin-bottom:15px;">
      <h2 style="font-size:22px;font-weight:900;margin:0 0 5px 0;text-transform:uppercase;">${businessName}</h2>
      <p style="font-size:16px;font-weight:bold;margin:0;color:#333;">${branch}</p>
    </div>
    <div style="border-top:2px dashed #000;border-bottom:2px dashed #000;padding:8px 0;margin-bottom:15px;font-size:15px;font-weight:bold;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>FECHA: ${fecha}</span><span>HORA: ${hora}</span></div>
      <div style="display:flex;justify-content:space-between;"><span>CAJERO: ${cajero.toUpperCase()}</span><span>FOLIO: #${folio}</span></div>
    </div>
    <table style="width:100%;margin-bottom:15px;font-size:15px;text-align:left;border-collapse:collapse;">
      <thead style="border-bottom:2px dashed #000;">
        <tr>
          <th style="padding-bottom:6px;width:25%;">CANT</th>
          <th style="padding-bottom:6px;width:50%;">DESC</th>
          <th style="padding-bottom:6px;width:25%;text-align:right;">IMP</th>
        </tr>
      </thead>
      <tbody>`

  items.forEach(i => {
    const qtyLabel = i.saleType === 'pieza' ? `${i.qty}PZ` : `${(i.qty / 1000).toFixed(2)}KG`
    const priceLabel = i.saleType === 'pieza' ? 'pz' : 'kg'
    html += `
      <tr>
        <td style="padding:6px 0;vertical-align:top;font-weight:bold;">${qtyLabel}</td>
        <td style="padding:6px 0;vertical-align:top;text-transform:uppercase;font-weight:bold;">
          ${i.name}
          <div style="font-size:12px;color:#444;text-transform:lowercase;font-weight:normal;margin-top:2px;">$${i.price.toFixed(2)}/${priceLabel}</div>
        </td>
        <td style="padding:6px 0;vertical-align:top;text-align:right;font-weight:bold;">$${i.total.toFixed(2)}</td>
      </tr>`
  })

  html += `</tbody></table>
    <div style="border-top:2px dashed #000;padding-top:10px;margin-bottom:15px;">
      <div style="display:flex;justify-content:space-between;align-items:center;font-weight:900;">
        <span style="font-size:18px;">TOTAL:</span>
        <span style="font-size:24px;">$${total.toFixed(2)}</span>
      </div>`

  if (pagoCliente > 0) {
    html += `<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:16px;font-weight:bold;"><span>EFECTIVO:</span><span>$${pagoCliente.toFixed(2)}</span></div>`
    if (pagoCliente >= total) {
      html += `<div style="display:flex;justify-content:space-between;font-weight:900;margin-top:4px;font-size:16px;"><span>CAMBIO:</span><span>$${(pagoCliente - total).toFixed(2)}</span></div>`
    }
  }

  html += `</div>
    <div style="text-align:center;margin-top:10px;">
      <p style="font-weight:900;font-size:16px;margin:0;">¡GRACIAS POR SU COMPRA!</p>
      <p style="font-size:13px;font-weight:bold;margin-top:4px;">Vuelva pronto</p>
    </div>
    <div style="text-align:center;margin-top:20px;font-size:12px;font-weight:bold;color:#000;">- - - - - - - - - - - - - -</div>
    <div style="height:80px;"></div>
  </div>`

  return html
}
