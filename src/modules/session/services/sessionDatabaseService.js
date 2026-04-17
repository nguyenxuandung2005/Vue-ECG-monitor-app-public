import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { firestoreDb } from '../../../firebase'

const PATIENTS_COLLECTION = 'patients'
const SESSIONS_COLLECTION = 'ecgSessions'

const sanitizePatientId = (patientId) =>
  String(patientId || '')
    .trim()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '') || 'UNKNOWN-PATIENT'

const normalizePatientProfile = (profile) => {
  if (!profile || !String(profile.fullName || '').trim()) {
    throw new Error('Patient profile must have a valid name before saving session.')
  }

  const normalizedId = sanitizePatientId(profile.id)

  return {
    id: normalizedId,
    fullName: String(profile.fullName || '').trim(),
    age: Number(profile.age) || 0,
    sex: String(profile.sex || '').trim(),
    diagnosis: String(profile.diagnosis || '').trim(),
    ward: String(profile.ward || '').trim(),
  }
}

export async function upsertPatientProfileIfNeeded(patientProfile) {
  const normalized = normalizePatientProfile(patientProfile)

  await setDoc(
    doc(firestoreDb, PATIENTS_COLLECTION, normalized.id),
    {
      ...normalized,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    },
    { merge: true },
  )

  return normalized
}

export async function saveRecordedSessionToDatabase({
  patientProfile,
  sessionId,
  sourceMode,
  samplingRate,
  recordedSamples,
  startedAtMs,
  endedAtMs,
  durationSeconds,
}) {
  if (!sessionId) {
    throw new Error('Session ID is missing.')
  }

  if (!Array.isArray(recordedSamples) || !recordedSamples.length) {
    throw new Error('No recorded ECG data found. Record before saving.')
  }

  const savedPatient = await upsertPatientProfileIfNeeded(patientProfile)

  const payload = {
    sessionId,
    patientId: savedPatient.id,
    patientName: savedPatient.fullName,
    sourceMode: sourceMode || 'simulated',
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    startedAtMs: Number(startedAtMs) || Date.now(),
    endedAtMs: Number(endedAtMs) || Date.now(),
    durationSeconds: Number(durationSeconds) || 0,
    recordedEcg: {
      sessionId,
      samplingRate: Number(samplingRate) || 50,
      sampleCount: recordedSamples.length,
      data: recordedSamples,
    },
  }

  const docRef = await addDoc(collection(firestoreDb, SESSIONS_COLLECTION), payload)

  return {
    id: docRef.id,
    sessionId,
    patientId: savedPatient.id,
    patientName: savedPatient.fullName,
    samplingRate: payload.recordedEcg.samplingRate,
    sampleCount: payload.recordedEcg.sampleCount,
  }
}

export async function listRecentSessionRecords(limitCount = 10) {
  const recordsQuery = query(
    collection(firestoreDb, SESSIONS_COLLECTION),
    orderBy('createdAtMs', 'desc'),
    limit(limitCount),
  )

  const snapshot = await getDocs(recordsQuery)

  return snapshot.docs.map((docRef) => {
    const data = docRef.data()

    return {
      id: docRef.id,
      sessionId: data.sessionId || docRef.id,
      patientId: data.patientId || 'UNKNOWN-PATIENT',
      patientName: data.patientName || 'Unknown Patient',
      createdAtMs: Number(data.createdAtMs) || 0,
      sourceMode: data.sourceMode || 'simulated',
      recordedEcg: {
        samplingRate: Number(data.recordedEcg?.samplingRate) || 0,
        sampleCount: Number(data.recordedEcg?.sampleCount) || 0,
        data: Array.isArray(data.recordedEcg?.data) ? data.recordedEcg.data : [],
      },
    }
  })
}

export async function listSessionRecordsByPatientId(patientId, limitCount = 30) {
  const normalizedPatientId = String(patientId || '').trim()
  if (!normalizedPatientId) {
    return []
  }

  const recordsQuery = query(
    collection(firestoreDb, SESSIONS_COLLECTION),
    where('patientId', '==', normalizedPatientId),
    limit(limitCount),
  )

  const snapshot = await getDocs(recordsQuery)

  const rows = snapshot.docs.map((docRef) => {
    const data = docRef.data()

    return {
      id: docRef.id,
      sessionId: data.sessionId || docRef.id,
      patientId: data.patientId || 'UNKNOWN-PATIENT',
      patientName: data.patientName || 'Unknown Patient',
      createdAtMs: Number(data.createdAtMs) || 0,
      sourceMode: data.sourceMode || 'simulated',
      recordedEcg: {
        samplingRate: Number(data.recordedEcg?.samplingRate) || 0,
        sampleCount: Number(data.recordedEcg?.sampleCount) || 0,
        data: Array.isArray(data.recordedEcg?.data) ? data.recordedEcg.data : [],
      },
    }
  })

  return rows.sort((a, b) => b.createdAtMs - a.createdAtMs)
}
