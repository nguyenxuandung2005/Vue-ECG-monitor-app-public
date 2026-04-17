import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../../../firebase'

const PATIENTS_COLLECTION = 'patients'

const sanitizePatientId = (patientId) =>
  String(patientId || '')
    .trim()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')

const generatePatientId = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const r = Math.floor(Math.random() * 900 + 100)
  return `PT-${y}${m}${d}-${r}`
}

export function getDefaultPatientProfile() {
  return {
    id: 'PT-2026-001',
    fullName: 'Nguyen Thi Minh Chau',
    age: 63,
    sex: 'Female',
    diagnosis: 'Post-op cardiac observation',
    ward: 'Cardiology / Bed 12',
  }
}

export async function listRecentPatients(limitCount = 50) {
  const patientsQuery = query(
    collection(firestoreDb, PATIENTS_COLLECTION),
    orderBy('updatedAtMs', 'desc'),
    limit(limitCount),
  )

  const snapshot = await getDocs(patientsQuery)

  return snapshot.docs.map((docRef) => {
    const data = docRef.data()
    return {
      id: data.id || docRef.id,
      fullName: data.fullName || 'Unknown Patient',
      age: Number(data.age) || 0,
      sex: data.sex || '',
      diagnosis: data.diagnosis || '',
      ward: data.ward || '',
      updatedAtMs: Number(data.updatedAtMs) || 0,
    }
  })
}

export async function savePatientProfileToDatabase(patientProfile) {
  if (!patientProfile || !String(patientProfile.fullName || '').trim()) {
    throw new Error('Patient name is required.')
  }

  const resolvedId = sanitizePatientId(patientProfile.id) || generatePatientId()

  const payload = {
    id: resolvedId,
    fullName: String(patientProfile.fullName || '').trim(),
    age: Number(patientProfile.age) || 0,
    sex: String(patientProfile.sex || '').trim(),
    diagnosis: String(patientProfile.diagnosis || '').trim(),
    ward: String(patientProfile.ward || '').trim(),
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now(),
  }

  await setDoc(doc(firestoreDb, PATIENTS_COLLECTION, resolvedId), payload, { merge: true })

  return {
    ...payload,
    updatedAt: undefined,
  }
}
