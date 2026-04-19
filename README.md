# 🌽 Xavi Comercializadora POS — React + Vite

Sistema de Punto de Venta Multi-Sucursal migrado a React + Vite con Firebase Firestore.

---

## 🚀 Instalación y Arranque

```bash
# 1. Entra a la carpeta del proyecto
cd xavi-pos

# 2. Instala las dependencias
npm install

# 3. Copia tu imagen xavi.png a la carpeta public/
#    (arrastra xavi.png dentro de la carpeta public/)

# 4. Arranca el servidor de desarrollo
npm run dev

# 5. Abre en el navegador: http://localhost:5173
```

---

## 🏗️ Estructura de Archivos

```
xavi-pos/
├── public/
│   └── xavi.png              ← ⚠️ COPIA AQUÍ TU LOGO
├── src/
│   ├── context/
│   │   └── AppContext.jsx    ← Estado global de la app
│   ├── services/
│   │   ├── firebase.js       ← Configuración Firebase
│   │   └── dataService.js    ← Todas las operaciones de BD
│   ├── utils/
│   │   └── helpers.js        ← Funciones auxiliares (ticket, imagen, WhatsApp)
│   ├── components/
│   │   ├── Header.jsx        ← Header + Corte de Caja
│   │   ├── TabsNav.jsx       ← Barra de pestañas
│   │   ├── Modal.jsx         ← Wrapper de modales
│   │   ├── Toast.jsx         ← Notificaciones
│   │   ├── ProductModal.jsx  ← Crear/Editar productos
│   │   ├── QuantityModal.jsx ← Agregar kg/piezas al carrito
│   │   ├── TicketModal.jsx   ← Mostrar e imprimir ticket
│   │   ├── UserModal.jsx     ← Crear/Editar usuarios
│   │   └── StockModal.jsx    ← Entrada y ajuste de stock
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── PuntoVenta.jsx
│   │   ├── VentasDia.jsx
│   │   ├── Almacen.jsx
│   │   ├── InventarioProductos.jsx
│   │   ├── RegistroEntradas.jsx
│   │   ├── ReporteDiario.jsx
│   │   ├── ReporteSemanal.jsx
│   │   ├── Estadisticas.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Calendario.jsx
│   │   └── CierreMensual.jsx
│   ├── App.jsx               ← Componente raíz
│   ├── main.jsx              ← Punto de entrada
│   └── index.css             ← Estilos globales + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## ✅ Funcionalidades Incluidas

- 🔐 Login con sesión guardada en localStorage
- 🛒 Punto de Venta completo con carrito, venta rápida y cambio
- 🧾 Historial de ventas del día con eliminación individual
- 🌾 Almacén multi-sucursal con alerta de inventario crítico
- 📦 Control de stock por pieza, por sucursal
- 📝 Registro de entradas con reversión de errores
- 📊 Reporte Diario con copia al portapapeles
- 📈 Reporte Semanal con PDF y desglose por sucursal
- 📉 Estadísticas con gráfica de barras
- 👥 Gestión de usuarios con roles (admin/empleado)
- 📅 Calendario de historial con navegación por fechas
- 📑 Cierre Mensual en PDF profesional
- 💰 Corte de Caja con envío a WhatsApp
- 🔧 Consolidación de sucursales huérfanas
- 🔄 Sincronización en tiempo real con Firebase

---

## 🌐 Deploy en Vercel

```bash
# 1. Sube el código a GitHub
git init
git add .
git commit -m "Migración a React"
git remote add origin https://github.com/tu-usuario/xavi-pos.git
git push -u origin main

# 2. Ve a https://vercel.com
# 3. Import Project → selecciona tu repo
# 4. Deploy ✅
```

---

## ⚠️ Pasos Importantes

1. **Copia `xavi.png`** a la carpeta `public/` (misma raíz que `src/`)
2. **Firebase ya está configurado** con las mismas credenciales del sistema original
3. La **base de datos de Firebase no cambia** — todos los datos existentes siguen funcionando
