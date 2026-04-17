import { computed, onUnmounted, ref } from 'vue'

export function useSessionRecorder() {
  const isRecording = ref(false)
  const elapsedSeconds = ref(0)
  const currentSessionId = ref('')
  const sourceMode = ref('simulated')
  const samplingRate = ref(50)
  const recordedSamples = ref([])
  const sessionStartMs = ref(0)
  const sessionEndMs = ref(0)
  const lastSavedSession = ref(null)
  const snapshots = ref([])

  const snapshotCount = computed(() => snapshots.value.length)
  const recordedSampleCount = computed(() => recordedSamples.value.length)
  const canSave = computed(() => !isRecording.value && recordedSamples.value.length > 0 && !!currentSessionId.value)

  let timerId = null

  const createSessionId = () => {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
    const randomSuffix = Math.floor(Math.random() * 900 + 100)
    return `SES-${stamp}-${randomSuffix}`
  }

  const startRecording = ({ inputSourceMode = 'simulated', inputSamplingRate = 50 } = {}) => {
    if (isRecording.value) {
      return
    }

    currentSessionId.value = createSessionId()
    sourceMode.value = inputSourceMode
    samplingRate.value = Number.isFinite(inputSamplingRate) ? inputSamplingRate : 50
    recordedSamples.value = []
    sessionStartMs.value = Date.now()
    sessionEndMs.value = 0
    isRecording.value = true
    elapsedSeconds.value = 0

    timerId = setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
  }

  const stopRecording = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }

    isRecording.value = false
    sessionEndMs.value = Date.now()
  }

  const appendSample = (sampleValue) => {
    if (!isRecording.value) {
      return
    }

    const parsed = Number(sampleValue)
    if (!Number.isFinite(parsed)) {
      return
    }

    recordedSamples.value.push(Number(parsed.toFixed(5)))
  }

  const resetSession = () => {
    stopRecording()
    elapsedSeconds.value = 0
    snapshots.value = []
    recordedSamples.value = []
    currentSessionId.value = ''
    sourceMode.value = 'simulated'
    samplingRate.value = 50
    sessionStartMs.value = 0
    sessionEndMs.value = 0
  }

  const addSnapshot = (payload) => {
    snapshots.value = [
      {
        id: `snap-${Date.now()}`,
        capturedAt: new Date().toISOString(),
        ...payload,
      },
      ...snapshots.value,
    ]
  }

  const markSessionSaved = (savePayload) => {
    lastSavedSession.value = savePayload
  }

  onUnmounted(() => {
    stopRecording()
  })

  return {
    isRecording,
    elapsedSeconds,
    currentSessionId,
    sourceMode,
    samplingRate,
    recordedSamples,
    recordedSampleCount,
    canSave,
    sessionStartMs,
    sessionEndMs,
    lastSavedSession,
    snapshots,
    snapshotCount,
    startRecording,
    stopRecording,
    appendSample,
    resetSession,
    addSnapshot,
    markSessionSaved,
  }
}
