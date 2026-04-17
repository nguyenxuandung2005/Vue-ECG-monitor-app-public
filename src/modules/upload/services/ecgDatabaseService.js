import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
import { firebaseStorage, firestoreDb } from '../../../firebase'

const ECG_RECORDS_COLLECTION = 'ecgRecords'
const PATIENTS_COLLECTION = 'patients'

const sanitizePatientName = (patientName) =>
  String(patientName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown-patient'

const sanitizePatientId = (patientId) =>
  String(patientId || '')
    .trim()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '') || 'unknown-id'

const buildStoragePath = ({ patientName, patientId, fileName }) => {
  const safePatientName = sanitizePatientName(patientName)
  const safePatientId = sanitizePatientId(patientId)
  const timestamp = Date.now()
  const safeFileName = String(fileName || 'ecg.csv').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `ecg-records/${safePatientId}-${safePatientName}/${timestamp}-${safeFileName}`
}

export async function upsertPatientProfileToDatabase(patientProfile) {
  const patientId = sanitizePatientId(patientProfile?.id)

  if (!patientProfile?.fullName || !String(patientProfile.fullName).trim()) {
    throw new Error('Patient name is required in patient profile.')
  }

  const payload = {
    id: patientId,
    fullName: String(patientProfile.fullName).trim(),
    age: Number(patientProfile.age) || 0,
    sex: String(patientProfile.sex || '').trim(),
    diagnosis: String(patientProfile.diagnosis || '').trim(),
    ward: String(patientProfile.ward || '').trim(),
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now(),
  }

  await setDoc(doc(firestoreDb, PATIENTS_COLLECTION, patientId), payload, { merge: true })

  return payload
}

export async function uploadEcgRecordToDatabase({
  file,
  patientProfile,
  samplingRate,
  sampleCount,
  estimatedHeartRate,
}) {
  if (!file) {
    throw new Error('Please select an ECG file before uploading.')
  }

  if (!patientProfile) {
    throw new Error('Missing patient profile data for upload.')
  }

  const savedPatient = await upsertPatientProfileToDatabase(patientProfile)

  const storagePath = buildStoragePath({
    patientName: savedPatient.fullName,
    patientId: savedPatient.id,
    fileName: file.name,
  })
  const fileRef = ref(firebaseStorage, storagePath)

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'text/csv',
  })

  const payload = {
    patientId: savedPatient.id,
    patientName: savedPatient.fullName,
    patientTag: `PAT-${savedPatient.id}`,
    patientSnapshot: {
      age: savedPatient.age,
      sex: savedPatient.sex,
      diagnosis: savedPatient.diagnosis,
      ward: savedPatient.ward,
    },
    originalFileName: file.name || 'ecg.csv',
    storagePath,
    fileSize: file.size || 0,
    sampleCount: Number.isFinite(sampleCount) ? sampleCount : 0,
    samplingRate: Number.isFinite(samplingRate) ? samplingRate : 250,
    estimatedHeartRate: Number.isFinite(estimatedHeartRate) ? estimatedHeartRate : 0,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
  }

  const docRef = await addDoc(collection(firestoreDb, ECG_RECORDS_COLLECTION), payload)

  return {
    id: docRef.id,
    ...payload,
  }
}

export async function listRecentEcgRecords(limitCount = 20) {
  const recordsQuery = query(
    collection(firestoreDb, ECG_RECORDS_COLLECTION),
    orderBy('createdAtMs', 'desc'),
    limit(limitCount),
  )

  const snapshot = await getDocs(recordsQuery)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export async function downloadEcgRecordText(storagePath) {
  if (!storagePath) {
    throw new Error('Missing file path for preview.')
  }

  const fileRef = ref(firebaseStorage, storagePath)
  const bytes = await getBytes(fileRef)
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}
