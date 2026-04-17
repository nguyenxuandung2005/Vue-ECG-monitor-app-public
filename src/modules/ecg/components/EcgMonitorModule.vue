<script setup>
import { computed } from 'vue'

const props = defineProps({
  waveform: {
    type: Array,
    required: true,
  },
  heartRate: {
    type: Number,
    required: true,
  },
  signalQuality: {
    type: String,
    required: true,
  },
  isRunning: {
    type: Boolean,
    required: true,
  },
  leadConnected: {
    type: Boolean,
    required: true,
  },
  sourceMode: {
    type: String,
    default: 'simulated',
  },
  monitorMode: {
    type: String,
    default: 'live',
  },
  hasPreviewSource: {
    type: Boolean,
    default: false,
  },
  uploadedFileName: {
    type: String,
    default: '',
  },
  recordedSessions: {
    type: Array,
    default: () => [],
  },
  isLoadingRecords: {
    type: Boolean,
    default: false,
  },
  recordsError: {
    type: String,
    default: '',
  },
  reviewingSessionId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['start', 'stop', 'toggle-lead', 'toggle-mode', 'refresh-records', 'preview-recorded-session'])

const chartPoints = computed(() => {
  if (!props.waveform.length) {
    return ''
  }

  const width = 980
  const topPadding = 24
  const chartHeight = 220
  const minY = topPadding
  const maxY = topPadding + chartHeight
  const samples = props.waveform

  const sampleMin = Math.min(...samples)
  const sampleMax = Math.max(...samples)
  const dynamicRange = sampleMax - sampleMin

  // Avoid division by zero and add a small padding so peaks do not touch the chart edges.
  const safeRange = dynamicRange > 0.0001 ? dynamicRange : 1
  const minWithPadding = sampleMin - safeRange * 0.1
  const maxWithPadding = sampleMax + safeRange * 0.1
  const paddedRange = maxWithPadding - minWithPadding

  return samples
    .map((sample, index) => {
      const x = (index / (samples.length - 1)) * width
      const normalized = (sample - minWithPadding) / paddedRange
      const y = maxY - normalized * chartHeight
      const clampedY = Math.min(maxY, Math.max(minY, y))
      return `${x},${clampedY}`
    })
    .join(' ')
})

const formatRecordTime = (createdAtMs) => {
  if (!createdAtMs) {
    return 'Unknown time'
  }

  return new Date(createdAtMs).toLocaleString('vi-VN', { hour12: false })
}
</script>

<template>
  <section class="panel monitor-panel">
    <header class="monitor-header">
      <div>
        <h2>Realtime ECG Monitor</h2>
        <p v-if="sourceMode === 'uploaded'">
          Playback source: {{ uploadedFileName || 'Uploaded CSV' }}
        </p>
        <p v-else>Lead II simulation for module-first architecture</p>
      </div>

      <div class="stats">
        <p class="mode-sign" :class="monitorMode === 'preview' ? 'preview' : 'live'">
          <span>Mode</span>
          <strong>{{ monitorMode === 'preview' ? 'PREVIEW' : 'LIVE' }}</strong>
        </p>
        <p>
          <strong>{{ heartRate }}</strong>
          <span>BPM</span>
        </p>
        <p class="quality">
          <span>Signal</span>
          <strong>{{ signalQuality }}</strong>
        </p>
      </div>
    </header>

    <div class="monitor-actions">
      <span class="actions-label">Monitor Controls</span>
      <button type="button" class="primary" :disabled="isRunning" @click="emit('start')">Start</button>
      <button type="button" class="secondary" :disabled="!isRunning" @click="emit('stop')">Stop</button>
      <button type="button" class="ghost" @click="emit('toggle-lead')">
        {{ leadConnected ? 'Disconnect Lead' : 'Reconnect Lead' }}
      </button>
      <button
        type="button"
        class="mode-toggle"
        :disabled="monitorMode === 'live' && !hasPreviewSource"
        @click="emit('toggle-mode')"
      >
        {{ monitorMode === 'preview' ? 'Switch to Live Mode' : 'Switch to Preview Mode' }}
      </button>
    </div>

    <div class="chart-shell">
      <svg viewBox="0 0 980 260" preserveAspectRatio="none" aria-label="Realtime ECG waveform">
        <defs>
          <pattern id="small-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(16, 24, 40, 0.12)" stroke-width="0.8" />
          </pattern>
          <pattern id="big-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#small-grid)" />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(16, 24, 40, 0.2)" stroke-width="1.1" />
          </pattern>
        </defs>

        <rect width="980" height="260" fill="url(#big-grid)" />
        <polyline :points="chartPoints" fill="none" stroke="#0a7f57" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />
      </svg>

      <p v-if="!leadConnected" class="overlay-warning">Lead disconnected. Waveform is paused.</p>
    </div>

    <section class="record-review">
      <div class="review-header">
        <h3>Review Recorded Sessions</h3>
        <button type="button" class="ghost" :disabled="isLoadingRecords" @click="emit('refresh-records')">
          {{ isLoadingRecords ? 'Loading...' : 'Refresh List' }}
        </button>
      </div>

      <p v-if="recordsError" class="review-status error">{{ recordsError }}</p>
      <p v-else-if="!recordedSessions.length" class="review-status">No recorded sessions found.</p>

      <ul v-else class="record-list">
        <li v-for="record in recordedSessions" :key="record.id">
          <div>
            <p class="record-title">{{ record.sessionId }} | {{ record.patientName }} ({{ record.patientId }})</p>
            <p class="record-meta">
              {{ record.recordedEcg.sampleCount }} samples | {{ record.recordedEcg.samplingRate }} Hz | {{ formatRecordTime(record.createdAtMs) }}
            </p>
          </div>
          <button
            type="button"
            class="primary"
            :disabled="reviewingSessionId === record.id"
            @click="emit('preview-recorded-session', record)"
          >
            {{ reviewingSessionId === record.id ? 'Opening...' : 'Preview' }}
          </button>
        </li>
      </ul>
    </section>
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

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
}

.monitor-header p {
  margin: 0.2rem 0 0;
  color: var(--muted-text);
  font-size: 0.9rem;
}

.stats {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.stats p {
  margin: 0;
  min-width: 86px;
  border-radius: 12px;
  background: var(--chip-bg);
  color: var(--chip-text);
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stats .mode-sign {
  min-width: 106px;
}

.stats .mode-sign.live {
  background: #dcfce7;
  color: #166534;
}

.stats .mode-sign.preview {
  background: #fff7ed;
  color: #9a3412;
}

.stats strong {
  font-size: 1.05rem;
}

.stats span {
  font-size: 0.74rem;
}

.monitor-actions {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
}

.actions-label {
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
  font-weight: 700;
}

button {
  border: none;
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
}

.primary {
  background: var(--action-primary);
  color: #fff;
  min-width: 88px;
}

.secondary {
  background: var(--action-secondary);
  color: #fff;
  min-width: 88px;
}

.ghost {
  background: #f4f5f7;
  color: #2f3a4a;
  min-width: 148px;
}

.mode-toggle {
  background: #0b7285;
  color: #fff;
  min-width: 220px;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chart-shell {
  margin-top: 1rem;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.record-review {
  margin-top: 1rem;
  border-top: 1px dashed #cbd5e1;
  padding-top: 0.8rem;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.review-header h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.98rem;
}

.review-header .ghost {
  min-width: 110px;
}

.review-status {
  margin: 0.55rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.review-status.error {
  color: #991b1b;
}

.record-list {
  list-style: none;
  margin: 0.55rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.record-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.55rem;
}

.record-title {
  margin: 0;
  font-size: 0.8rem;
  color: #0f172a;
  font-weight: 700;
}

.record-meta {
  margin: 0.12rem 0 0;
  font-size: 0.74rem;
  color: #64748b;
}

svg {
  width: 100%;
  height: 320px;
  display: block;
  background: #fcfdfc;
}

.overlay-warning {
  position: absolute;
  right: 1rem;
  top: 1rem;
  margin: 0;
  background: rgba(124, 45, 18, 0.9);
  color: #fff;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  font-size: 0.82rem;
}

@media (max-width: 740px) {
  .monitor-header {
    flex-direction: column;
  }

  .stats {
    width: 100%;
  }

  .stats p {
    flex: 1;
    align-items: flex-start;
  }
}
</style>
