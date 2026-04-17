<script setup>
import { computed } from 'vue'
import { formatDuration } from '../services/timeFormatter'

const props = defineProps({
  isRecording: {
    type: Boolean,
    required: true,
  },
  elapsedSeconds: {
    type: Number,
    required: true,
  },
  currentSessionId: {
    type: String,
    default: '',
  },
  sourceMode: {
    type: String,
    default: 'simulated',
  },
  samplingRate: {
    type: Number,
    default: 0,
  },
  recordedSampleCount: {
    type: Number,
    required: true,
  },
  canSave: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  saveMessage: {
    type: String,
    default: '',
  },
  saveError: {
    type: String,
    default: '',
  },
  lastSavedSession: {
    type: Object,
    default: null,
  },
  patientId: {
    type: String,
    default: '',
  },
  patientName: {
    type: String,
    default: '',
  },
  sourceFileName: {
    type: String,
    default: '',
  },
  isMonitorRunning: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['start', 'stop', 'reset', 'save'])

const elapsedTimeLabel = computed(() => formatDuration(props.elapsedSeconds))
const sourceLabel = computed(() => (props.sourceMode === 'uploaded' ? 'Uploaded ECG file' : 'Generated ECG signal'))
</script>

<template>
  <section class="panel session-panel">
    <header class="panel-header">
      <h2>Session Recorder</h2>
      <p>{{ elapsedTimeLabel }}</p>
    </header>

    <div class="session-meta">
      <p><strong>Patient</strong><span>{{ patientName }} ({{ patientId }})</span></p>
      <p><strong>Session ID</strong><span>{{ currentSessionId || 'Not started' }}</span></p>
      <p><strong>Input source</strong><span>{{ sourceLabel }}<template v-if="sourceMode === 'uploaded' && sourceFileName"> - {{ sourceFileName }}</template></span></p>
      <p><strong>Sampling rate</strong><span>{{ samplingRate }} Hz</span></p>
      <p><strong>Recorded points</strong><span>{{ recordedSampleCount }}</span></p>
    </div>

    <div class="session-actions">
      <button v-if="!isRecording" type="button" class="primary" @click="emit('start')">Record</button>
      <button v-else type="button" class="secondary" @click="emit('stop')">Stop</button>
      <button type="button" class="save" :disabled="!canSave || isSaving" @click="emit('save')">
        {{ isSaving ? 'Saving...' : 'Save Session' }}
      </button>
      <button type="button" class="danger" @click="emit('reset')">Reset</button>
    </div>

    <p class="counter">Monitor status: {{ isMonitorRunning ? 'Running' : 'Stopped' }}</p>
    <p v-if="saveMessage" class="status ok">{{ saveMessage }}</p>
    <p v-if="saveError" class="status error">{{ saveError }}</p>

    <div v-if="lastSavedSession" class="last-saved">
      <p><strong>Last saved Session</strong></p>
      <p>Session ID: {{ lastSavedSession.sessionId }}</p>
      <p>Patient ID: {{ lastSavedSession.patientId }}</p>
      <p>Samples: {{ lastSavedSession.sampleCount }} at {{ lastSavedSession.samplingRate }} Hz</p>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--soft-shadow);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}

.panel-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.panel-header p {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--action-secondary);
}

.session-actions {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button {
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: var(--action-primary);
  color: #fff;
}

.secondary {
  background: var(--action-secondary);
  color: #fff;
}

.ghost {
  background: #eef2ff;
  color: #3730a3;
}

.save {
  background: #065f46;
  color: #fff;
}

.danger {
  background: #fee2e2;
  color: #9f1239;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.counter {
  margin: 0.8rem 0 0;
  color: var(--muted-text);
  font-size: 0.9rem;
}

.session-meta {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.4rem;
}

.session-meta p {
  margin: 0;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.65rem;
  font-size: 0.84rem;
}

.status {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
}

.status.ok {
  background: #ecfdf5;
  color: #065f46;
}

.status.error {
  background: #fef2f2;
  color: #991b1b;
}

.last-saved {
  margin-top: 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  font-size: 0.82rem;
}

.last-saved p {
  margin: 0.2rem 0;
}
</style>
