<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import AlertsModule from './modules/alerts/components/AlertsModule.vue'
import EcgMonitorModule from './modules/ecg/components/EcgMonitorModule.vue'
import { useAlerts } from './modules/alerts/composables/useAlerts'
import { useEcgMonitor } from './modules/ecg/composables/useEcgMonitor'
import PatientModule from './modules/patient/components/PatientModule.vue'
import { getDefaultPatientProfile } from './modules/patient/services/patientProfileService'
import SessionModule from './modules/session/components/SessionModule.vue'
import { useSessionRecorder } from './modules/session/composables/useSessionRecorder'
import { listSessionRecordsByPatientId, saveRecordedSessionToDatabase } from './modules/session/services/sessionDatabaseService'
import EcgUploadModule from './modules/upload/components/EcgUploadModule.vue'

const patientProfile = reactive(getDefaultPatientProfile())

const ecgMonitor = useEcgMonitor()
const alertEngine = useAlerts({
  heartRate: ecgMonitor.heartRate,
  leadConnected: ecgMonitor.leadConnected,
  isRunning: ecgMonitor.isRunning,
})
const sessionRecorder = useSessionRecorder()
const isSavingSession = ref(false)
const sessionSaveMessage = ref('')
const sessionSaveError = ref('')
const monitorRecordOptions = ref([])
const isLoadingMonitorRecords = ref(false)
const monitorRecordsError = ref('')
const reviewingSessionId = ref('')
const lastPreviewPayload = ref(null)
const monitorMode = computed(() => (ecgMonitor.sourceMode.value === 'uploaded' ? 'preview' : 'live'))

const thresholdForm = reactive({
  minHeartRate: alertEngine.thresholds.minHeartRate,
  maxHeartRate: alertEngine.thresholds.maxHeartRate,
})

const applyThresholds = () => {
  alertEngine.updateThresholds({
    minHeartRate: Number(thresholdForm.minHeartRate),
    maxHeartRate: Number(thresholdForm.maxHeartRate),
  })
}

const activatePreviewPayload = (payload) => {
  lastPreviewPayload.value = payload
  ecgMonitor.stopMonitoring()
  ecgMonitor.loadUploadedSignal(payload)
  ecgMonitor.startMonitoring()
}

const handleUploadLoaded = (payload) => {
  activatePreviewPayload(payload)
}

const handleUploadCleared = () => {
  ecgMonitor.clearUploadedSignal()
  lastPreviewPayload.value = null
}

const handlePatientSelected = (selectedProfile) => {
  Object.assign(patientProfile, selectedProfile)
}

const refreshMonitorRecords = async () => {
  isLoadingMonitorRecords.value = true
  monitorRecordsError.value = ''

  try {
    monitorRecordOptions.value = await listSessionRecordsByPatientId(patientProfile.id, 30)
  } catch (error) {
    monitorRecordsError.value =
      error instanceof Error ? `Cannot load session records: ${error.message}` : 'Cannot load session records.'
  } finally {
    isLoadingMonitorRecords.value = false
  }
}

const handlePreviewRecordedSession = (sessionRecord) => {
  if (!sessionRecord?.recordedEcg?.data?.length) {
    monitorRecordsError.value = 'Selected session has no ECG data to preview.'
    return
  }

  reviewingSessionId.value = sessionRecord.id
  monitorRecordsError.value = ''

  activatePreviewPayload({
    fileName: `${sessionRecord.sessionId}.session`,
    samples: sessionRecord.recordedEcg.data,
    samplingRate: sessionRecord.recordedEcg.samplingRate,
    sampleCount: sessionRecord.recordedEcg.sampleCount,
    estimatedHeartRate: 0,
  })

  Object.assign(patientProfile, {
    id: sessionRecord.patientId,
    fullName: sessionRecord.patientName,
  })

  setTimeout(() => {
    reviewingSessionId.value = ''
  }, 300)
}

const handleToggleMonitorMode = () => {
  monitorRecordsError.value = ''

  if (monitorMode.value === 'preview') {
    ecgMonitor.clearUploadedSignal()
    if (!ecgMonitor.isRunning.value) {
      ecgMonitor.startMonitoring()
    }
    return
  }

  if (!lastPreviewPayload.value) {
    monitorRecordsError.value = 'No preview ECG source available yet. Load CSV or preview a recorded session first.'
    return
  }

  activatePreviewPayload(lastPreviewPayload.value)
}

const handleStartSessionRecording = () => {
  sessionSaveError.value = ''
  sessionSaveMessage.value = ''

  if (!ecgMonitor.isRunning.value) {
    ecgMonitor.startMonitoring()
  }

  sessionRecorder.startRecording({
    inputSourceMode: ecgMonitor.sourceMode.value,
    inputSamplingRate: ecgMonitor.currentSamplingRate.value,
  })
}

const handleStopSessionRecording = () => {
  sessionRecorder.stopRecording()
}

const handleSaveSession = async () => {
  if (!sessionRecorder.canSave.value) {
    sessionSaveError.value = 'No recorded ECG data available to save.'
    return
  }

  isSavingSession.value = true
  sessionSaveError.value = ''
  sessionSaveMessage.value = ''

  try {
    const savedSession = await saveRecordedSessionToDatabase({
      patientProfile: { ...patientProfile },
      sessionId: sessionRecorder.currentSessionId.value,
      sourceMode: sessionRecorder.sourceMode.value,
      samplingRate: sessionRecorder.samplingRate.value,
      recordedSamples: [...sessionRecorder.recordedSamples.value],
      startedAtMs: sessionRecorder.sessionStartMs.value,
      endedAtMs: sessionRecorder.sessionEndMs.value,
      durationSeconds: sessionRecorder.elapsedSeconds.value,
    })

    sessionRecorder.markSessionSaved(savedSession)
    sessionSaveMessage.value = `Session saved: ${savedSession.sessionId} for patient ${savedSession.patientId}.`
    await refreshMonitorRecords()
  } catch (error) {
    sessionSaveError.value = error instanceof Error ? error.message : 'Save session failed.'
  } finally {
    isSavingSession.value = false
  }
}

const unsubscribeSampleStream = ecgMonitor.subscribeSampleStream((sample) => {
  sessionRecorder.appendSample(sample)
})

onMounted(() => {
  refreshMonitorRecords()
})

watch(
  () => patientProfile.id,
  () => {
    refreshMonitorRecords()
  },
)

onUnmounted(() => {
  unsubscribeSampleStream()
})
</script>

<template>
  <main class="ecg-app">
    <header class="page-header fade-in-up">
      <p class="eyebrow">IT for Healthcare Systems</p>
      <h1>ECG Monitor App</h1>
      <p class="subline">
        Module-based architecture with CSV upload: patient profile, realtime ECG stream, alerts, and session recording.
      </p>
    </header>

    <section class="layout-grid fade-in-up delay-1">
      <div class="monitor-column">
        <EcgMonitorModule
          :waveform="ecgMonitor.waveform.value"
          :heart-rate="ecgMonitor.heartRate.value"
          :signal-quality="ecgMonitor.signalQuality.value"
          :is-running="ecgMonitor.isRunning.value"
          :lead-connected="ecgMonitor.leadConnected.value"
          :source-mode="ecgMonitor.sourceMode.value"
          :monitor-mode="monitorMode"
          :has-preview-source="Boolean(lastPreviewPayload)"
          :uploaded-file-name="ecgMonitor.uploadedFileName.value"
          :recorded-sessions="monitorRecordOptions"
          :is-loading-records="isLoadingMonitorRecords"
          :records-error="monitorRecordsError"
          :reviewing-session-id="reviewingSessionId"
          @start="ecgMonitor.startMonitoring"
          @stop="ecgMonitor.stopMonitoring"
          @toggle-lead="ecgMonitor.toggleLeadConnection"
          @toggle-mode="handleToggleMonitorMode"
          @refresh-records="refreshMonitorRecords"
          @preview-recorded-session="handlePreviewRecordedSession"
        />

        <EcgUploadModule
          :source-mode="ecgMonitor.sourceMode.value"
          :uploaded-file-name="ecgMonitor.uploadedFileName.value"
          :uploaded-sample-count="ecgMonitor.uploadedSampleCount.value"
          @loaded="handleUploadLoaded"
          @clear="handleUploadCleared"
        />
      </div>

      <aside class="side-column">
        <PatientModule :patient="patientProfile" @select-patient="handlePatientSelected" />

        <SessionModule
          :is-recording="sessionRecorder.isRecording.value"
          :elapsed-seconds="sessionRecorder.elapsedSeconds.value"
          :current-session-id="sessionRecorder.currentSessionId.value"
          :source-mode="sessionRecorder.sourceMode.value"
          :sampling-rate="sessionRecorder.samplingRate.value"
          :recorded-sample-count="sessionRecorder.recordedSampleCount.value"
          :can-save="sessionRecorder.canSave.value"
          :is-saving="isSavingSession.value"
          :save-message="sessionSaveMessage.value"
          :save-error="sessionSaveError.value"
          :last-saved-session="sessionRecorder.lastSavedSession.value"
          :patient-id="patientProfile.id"
          :patient-name="patientProfile.fullName"
          :source-file-name="ecgMonitor.uploadedFileName.value"
          :is-monitor-running="ecgMonitor.isRunning.value"
          @start="handleStartSessionRecording"
          @stop="handleStopSessionRecording"
          @save="handleSaveSession"
          @reset="sessionRecorder.resetSession"
        />

        <section class="panel threshold-panel">
          <h2>Alert Threshold Config</h2>
          <form class="threshold-form" @submit.prevent="applyThresholds">
            <label>
              Min BPM
              <input v-model.number="thresholdForm.minHeartRate" type="number" min="30" max="100" />
            </label>
            <label>
              Max BPM
              <input v-model.number="thresholdForm.maxHeartRate" type="number" min="100" max="200" />
            </label>
            <button type="submit">Apply</button>
          </form>
        </section>

        <AlertsModule :alerts="alertEngine.alerts.value" :thresholds="alertEngine.thresholds" />
      </aside>
    </section>
  </main>
</template>

<style scoped>
.ecg-app {
  display: grid;
  gap: 1.1rem;
}

.page-header {
  padding: 1.2rem;
  border-radius: 18px;
  background: linear-gradient(125deg, rgba(10, 127, 87, 0.2), rgba(15, 23, 42, 0.08));
  border: 1px solid rgba(10, 127, 87, 0.2);
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
  font-size: 0.74rem;
  font-weight: 700;
}

h1 {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 2.2vw, 2.3rem);
}

.subline {
  margin: 0.45rem 0 0;
  color: var(--muted-text);
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 1rem;
}

.monitor-column {
  display: grid;
  gap: 0.9rem;
  align-content: start;
}

.side-column {
  display: grid;
  gap: 0.9rem;
  align-content: start;
}

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--soft-shadow);
}

.threshold-panel h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.threshold-form {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.6rem;
}

.threshold-form label {
  display: grid;
  gap: 0.25rem;
  color: var(--label-text);
  font-size: 0.85rem;
}

.threshold-form input {
  border: 1px solid #ced4da;
  border-radius: 10px;
  padding: 0.45rem 0.55rem;
  font-size: 0.9rem;
}

.threshold-form button {
  margin-top: 0.15rem;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  background: #0f766e;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.fade-in-up {
  animation: fadeUp 520ms ease both;
}

.delay-1 {
  animation-delay: 140ms;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
