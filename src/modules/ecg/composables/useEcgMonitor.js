import { computed, onUnmounted, ref } from 'vue'
import { createEcgSample } from '../services/ecgSignalGenerator'

const SAMPLE_PERIOD_MS = 20
const WINDOW_SIZE = 420

const SOURCE_MODES = {
  SIMULATED: 'simulated',
  UPLOADED: 'uploaded',
}

export function useEcgMonitor() {
  const waveform = ref(Array.from({ length: WINDOW_SIZE }, () => 0))
  const heartRate = ref(78)
  const leadConnected = ref(true)
  const isRunning = ref(false)
  const sourceMode = ref(SOURCE_MODES.SIMULATED)
  const uploadedFileName = ref('')
  const uploadedSampleCount = ref(0)

  const uploadedSamplingRate = ref(250)
  const uploadedEstimatedHeartRate = ref(0)
  const uploadedSamples = ref([])
  const playbackCursor = ref(0)

  const signalQuality = computed(() => {
    if (!leadConnected.value) {
      return 'Lead Off'
    }

    if (sourceMode.value === SOURCE_MODES.UPLOADED && !isRunning.value && uploadedSamples.value.length) {
      return 'File Ready'
    }

    return isRunning.value ? 'Good' : 'Standby'
  })

  const currentSamplingRate = computed(() => {
    if (sourceMode.value === SOURCE_MODES.UPLOADED) {
      return uploadedSamplingRate.value
    }
    return Math.round(1000 / SAMPLE_PERIOD_MS)
  })

  let timerId = null
  let tickCount = 0
  const sampleListeners = new Set()

  const notifySample = (sample) => {
    sampleListeners.forEach((listener) => {
      listener(sample)
    })
  }

  const pushSample = (sample) => {
    waveform.value = [...waveform.value.slice(1), sample]
    notifySample(sample)
  }

  const createWaveformWindowFromSamples = (samples) => {
    if (!Array.isArray(samples) || !samples.length) {
      return Array.from({ length: WINDOW_SIZE }, () => 0)
    }

    if (samples.length >= WINDOW_SIZE) {
      return samples.slice(0, WINDOW_SIZE)
    }

    const repeated = []
    while (repeated.length < WINDOW_SIZE) {
      repeated.push(...samples)
    }

    return repeated.slice(0, WINDOW_SIZE)
  }

  const runUploadedTick = () => {
    const samples = uploadedSamples.value
    if (!samples.length) {
      pushSample(0)
      heartRate.value = 0
      return
    }

    const samplesPerTick = Math.max(1, Math.round((uploadedSamplingRate.value * SAMPLE_PERIOD_MS) / 1000))

    for (let index = 0; index < samplesPerTick; index += 1) {
      const sample = samples[playbackCursor.value]
      pushSample(sample)
      playbackCursor.value = (playbackCursor.value + 1) % samples.length
    }

    if (uploadedEstimatedHeartRate.value > 0) {
      heartRate.value = uploadedEstimatedHeartRate.value
    }
  }

  const runTick = () => {
    tickCount += 1

    if (!leadConnected.value) {
      pushSample(0)
      heartRate.value = 0
      return
    }

    if (sourceMode.value === SOURCE_MODES.UPLOADED) {
      runUploadedTick()
      return
    }

    const timeInSeconds = (tickCount * SAMPLE_PERIOD_MS) / 1000
    const drift = 4 * Math.sin(timeInSeconds * 0.22) + 2 * Math.sin(timeInSeconds * 0.41)
    heartRate.value = Math.round(76 + drift)

    const sample = createEcgSample(timeInSeconds, heartRate.value)
    pushSample(sample)
  }

  const startMonitoring = () => {
    if (isRunning.value) {
      return
    }

    isRunning.value = true
    timerId = setInterval(runTick, SAMPLE_PERIOD_MS)
  }

  const stopMonitoring = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    isRunning.value = false
  }

  const toggleLeadConnection = () => {
    leadConnected.value = !leadConnected.value

    if (leadConnected.value && !isRunning.value) {
      heartRate.value = sourceMode.value === SOURCE_MODES.UPLOADED ? uploadedEstimatedHeartRate.value || 78 : 78
    }
  }

  const loadUploadedSignal = ({ samples, samplingRate, fileName, sampleCount, estimatedHeartRate }) => {
    if (!Array.isArray(samples) || !samples.length) {
      return
    }

    sourceMode.value = SOURCE_MODES.UPLOADED
    uploadedSamples.value = samples
    uploadedSamplingRate.value = Number.isFinite(samplingRate) ? samplingRate : 250
    uploadedEstimatedHeartRate.value = Number.isFinite(estimatedHeartRate) ? estimatedHeartRate : 0
    uploadedFileName.value = fileName || 'uploaded.csv'
    uploadedSampleCount.value = Number.isFinite(sampleCount) ? sampleCount : samples.length
    waveform.value = createWaveformWindowFromSamples(samples)
    playbackCursor.value = waveform.value.length % samples.length
    heartRate.value = uploadedEstimatedHeartRate.value || heartRate.value
    leadConnected.value = true
  }

  const clearUploadedSignal = () => {
    sourceMode.value = SOURCE_MODES.SIMULATED
    uploadedSamples.value = []
    uploadedSamplingRate.value = 250
    uploadedEstimatedHeartRate.value = 0
    uploadedFileName.value = ''
    uploadedSampleCount.value = 0
    playbackCursor.value = 0

    if (!isRunning.value) {
      heartRate.value = 78
    }
  }

  const subscribeSampleStream = (listener) => {
    if (typeof listener !== 'function') {
      return () => {}
    }

    sampleListeners.add(listener)
    return () => {
      sampleListeners.delete(listener)
    }
  }

  onUnmounted(() => {
    stopMonitoring()
    sampleListeners.clear()
  })

  return {
    waveform,
    heartRate,
    leadConnected,
    isRunning,
    signalQuality,
    currentSamplingRate,
    sourceMode,
    uploadedFileName,
    uploadedSampleCount,
    startMonitoring,
    stopMonitoring,
    toggleLeadConnection,
    loadUploadedSignal,
    clearUploadedSignal,
    subscribeSampleStream,
  }
}
