// src/services/dataService.js
import {
  doc, getDoc, setDoc, collection,
  query, where, getDocs, deleteDoc, addDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

const SYSTEM_DOC = 'punto_de_venta'
const SYSTEM_COLLECTION = 'datos_sistema'
const DATES_DOC = 'control_fechas'
const VENTAS_COLLECTION = 'ventas'
const ENTRADAS_COLLECTION = 'entradas_stock'

const CACHE_KEY = 'pos_system_cache'

export const DEFAULT_USERS = [
  { id: 1, username: 'Admin', password: 'Admin', role: 'admin', branch: 'Todas' },
  { id: 2, username: 'sucursal uno', password: '1234', role: 'empleado', branch: 'Sucursal 1' },
]

export const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Tortilla de Maíz', price: 22, saleType: 'kg', emoji: '🫓', color: 'amber', branches: ['Sucursal 1'], stocks: {} },
  { id: 2, name: 'Queso Fresco', price: 45, saleType: 'pieza', emoji: '🧀', color: 'yellow', branches: ['Sucursal 1'], stocks: {} },
]

const DEFAULT_DATA = {
  businessName: 'Tortillería El Maíz Dorado',
  products: DEFAULT_PRODUCTS,
  users: DEFAULT_USERS,
  inventory: {},
  weeklyHistory: [],
  branch_aliases: {},
}

function saveToCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch (e) {}
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

function normalizeData(data) {
  if (!data) return { ...DEFAULT_DATA }
  if (data.products) {
    data.products = data.products.map(p => ({
      ...p,
      price: p.price !== undefined ? p.price : p.pricePerKg,
      saleType: p.saleType || 'kg',
    }))
  }
  if (!data.inventory) data.inventory = {}
  if (!data.branch_aliases) data.branch_aliases = {}
  if (!data.users || data.users.length === 0) data.users = DEFAULT_USERS
  return data
}

export async function loadSystemData() {
  try {
    const ref = doc(db, SYSTEM_COLLECTION, SYSTEM_DOC)
    // With persistentLocalCache this resolves instantly from disk
    // even when offline — no timeout needed
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      await setDoc(ref, DEFAULT_DATA)
      await setDoc(doc(db, SYSTEM_COLLECTION, DATES_DOC), { ultimaFecha: new Date().toDateString() })
      saveToCache(DEFAULT_DATA)
      return { ...DEFAULT_DATA }
    }

    let data = normalizeData(snap.data())

    // Date rollover — skip if offline
    try {
      const today = new Date().toDateString()
      const dateRef = doc(db, SYSTEM_COLLECTION, DATES_DOC)
      const dateSnap = await getDoc(dateRef)
      if (!dateSnap.exists() || dateSnap.data().ultimaFecha !== today) {
        await setDoc(dateRef, { ultimaFecha: today })
      }
    } catch (e) {}

    saveToCache(data)
    return data

  } catch (e) {
    console.warn('loadSystemData error, using localStorage cache:', e.message)
    const cached = loadFromCache()
    return cached ? normalizeData(cached) : { ...DEFAULT_DATA }
  }
}

export async function saveSystemData(data) {
  const toSave = { ...data }
  delete toSave.cart
  delete toSave.salesHistory
  await setDoc(doc(db, SYSTEM_COLLECTION, SYSTEM_DOC), toSave)
}

export async function savePartial(updates) {
  try {
    await setDoc(doc(db, SYSTEM_COLLECTION, SYSTEM_DOC), updates, { merge: true })
    const cached = loadFromCache()
    if (cached) saveToCache({ ...cached, ...updates })
  } catch (e) {
    console.warn('savePartial failed:', e.message)
    const cached = loadFromCache()
    if (cached) saveToCache({ ...cached, ...updates })
  }
}

export async function fetchSalesByDate(dateStr) {
  try {
    const q = query(collection(db, VENTAS_COLLECTION), where('dateString', '==', dateStr))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data()).sort((a, b) => a.timestamp - b.timestamp)
  } catch (e) { return [] }
}

export async function fetchSalesByDateRange(startMs, endMs) {
  try {
    const q = query(
      collection(db, VENTAS_COLLECTION),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  } catch (e) { return [] }
}

export async function fetchSalesFrom(startMs) {
  try {
    const q = query(collection(db, VENTAS_COLLECTION), where('timestamp', '>=', startMs))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data())
  } catch (e) { return [] }
}

export async function saveSale(sale) {
  const ref = doc(db, VENTAS_COLLECTION, sale.timestamp.toString())
  await setDoc(ref, sale)
}

export async function deleteSale(timestamp) {
  await deleteDoc(doc(db, VENTAS_COLLECTION, timestamp.toString()))
}

export async function addStockEntry(entry) {
  try { await addDoc(collection(db, ENTRADAS_COLLECTION), entry) } catch (e) {}
}

export async function fetchStockEntries() {
  try {
    const snap = await getDocs(collection(db, ENTRADAS_COLLECTION))
    return snap.docs.map(d => ({ docId: d.id, ...d.data() }))
  } catch (e) { return [] }
}

export async function fetchStockEntriesFrom(startMs) {
  try {
    const q = query(collection(db, ENTRADAS_COLLECTION), where('timestamp', '>=', startMs))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ docId: d.id, ...d.data() }))
  } catch (e) { return [] }
}

export async function deleteStockEntry(docId) {
  await deleteDoc(doc(db, ENTRADAS_COLLECTION, docId))
}

export function subscribeToSystem(callback) {
  const ref = doc(db, SYSTEM_COLLECTION, SYSTEM_DOC)
  return onSnapshot(ref, { includeMetadataChanges: false }, callback, (err) => {
    console.warn('subscribeToSystem error:', err.message)
  })
}

export function subscribeToTodaySales(callback) {
  const todayStr = new Date().toDateString()
  const q = query(collection(db, VENTAS_COLLECTION), where('dateString', '==', todayStr))
  return onSnapshot(q, { includeMetadataChanges: false }, callback, (err) => {
    console.warn('subscribeToTodaySales error:', err.message)
  })
}