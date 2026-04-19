// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDqCqCy-TmDJ5q8CFqvD80la_QXR2MrEwc",
  authDomain: "xavi-comercializadora-tortille.firebaseapp.com",
  projectId: "xavi-comercializadora-tortille",
  storageBucket: "xavi-comercializadora-tortille.firebasestorage.app",
  messagingSenderId: "70538183113",
  appId: "1:70538183113:web:72273de771d4611cad6818",
  measurementId: "G-91T01MJD07"
}

const app = initializeApp(firebaseConfig)

// Use initializeFirestore instead of getFirestore to enable persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

export default app