<script setup>
import { ref } from 'vue'
import { parseEcgCsv } from '../services/parseEcgCsv'

const props = defineProps({
  sourceMode: {
    type: String,
    required: true,
  },
  uploadedFileName: {
    type: String,
    default: '',
  },
  uploadedSampleCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['loaded', 'clear'])

const selectedFile = ref(null)
const samplingRate = ref(250)
const parseError = ref('')
const parseInfo = ref('')
const isParsing = ref(false)

const onFileChange = (event) => {
  selectedFile.value = event.target.files?.[0] ?? null
  parseError.value = ''
  parseInfo.value = ''
}

const readAndParseSelectedFile = async () => {
  if (!selectedFile.value) {
    throw new Error('Please choose a CSV file first.')
  }

  const textContent = await selectedFile.value.text()
  const parsed = parseEcgCsv(textContent, Number(samplingRate.value))

  return {
    parsed,
  }
}

const loadFile = async () => {
  isParsing.value = true
  parseError.value = ''
  parseInfo.value = ''

  try {
    const { parsed } = await readAndParseSelectedFile()

    emit('loaded', {
      fileName: selectedFile.value.name,
      samples: parsed.samples,
      samplingRate: parsed.samplingRate,
      sampleCount: parsed.sampleCount,
      estimatedHeartRate: parsed.estimatedHeartRate,
    })

    parseInfo.value = `Loaded ${parsed.sampleCount} samples from ${selectedFile.value.name}.`
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Failed to parse CSV file.'
  } finally {
    isParsing.value = false
  }
}

const clearLoadedData = () => {
  parseError.value = ''
  parseInfo.value = ''
  selectedFile.value = null
  emit('clear')
}

const useGeneratedSource = () => {
  clearLoadedData()
}
</script>

<template>
  <section class="panel upload-panel">
    <header>
      <h2>ECG Simulation Input Board</h2>
      <p>Choose how the monitor gets ECG input: generated signal or CSV file.</p>
      <p class="hint">Recorded session will use whichever source is active.</p>
    </header>

    <div class="table-wrapper">
      <table class="simulation-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Config</th>
            <th>Action</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Generated ECG</strong>
              <p>Built-in simulated waveform</p>
            </td>
            <td><span class="mono">No file required</span></td>
            <td>
              <button type="button" class="secondary" @click="useGeneratedSource">Use Generated</button>
            </td>
            <td>
              <span class="badge" :class="sourceMode === 'simulated' ? 'active' : 'inactive'">
                {{ sourceMode === 'simulated' ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>

          <tr>
            <td>
              <strong>CSV ECG</strong>
              <p>Load ECG sample file</p>
            </td>
            <td>
              <div class="csv-config">
                <input type="file" accept=".csv,.txt" @change="onFileChange" />
                <label>
                  Sampling Rate (Hz)
                  <input v-model.number="samplingRate" type="number" min="50" max="2000" step="1" />
                </label>
              </div>
            </td>
            <td>
              <button type="button" class="primary" :disabled="isParsing" @click="loadFile">
                {{ isParsing ? 'Parsing...' : 'Load CSV' }}
              </button>
            </td>
            <td>
              <span class="badge" :class="sourceMode === 'uploaded' ? 'active' : 'inactive'">
                {{ sourceMode === 'uploaded' ? 'Active' : 'Inactive' }}
              </span>
              <p v-if="sourceMode === 'uploaded'" class="file-meta">{{ uploadedFileName }} ({{ uploadedSampleCount }} samples)</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="hint">Supported CSV: one numeric column, or time,ecg format (see public/sample-ecg.csv).</p>
    <p v-if="parseInfo" class="status info">{{ parseInfo }}</p>
    <p v-if="parseError" class="status error">{{ parseError }}</p>
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

header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

header p {
  margin: 0.35rem 0 0;
  color: var(--muted-text);
  font-size: 0.9rem;
}

.hint {
  font-size: 0.8rem;
  color: #475569;
}

.table-wrapper {
  margin-top: 0.75rem;
  overflow-x: auto;
}

.simulation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.simulation-table th,
.simulation-table td {
  border: 1px solid #dbe3ef;
  vertical-align: top;
  padding: 0.6rem;
}

.simulation-table th {
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  text-align: left;
}

.simulation-table strong {
  display: block;
  font-family: var(--font-display);
  margin-bottom: 0.2rem;
}

.simulation-table p {
  margin: 0;
  color: #64748b;
}

.csv-config {
  display: grid;
  gap: 0.55rem;
}

.csv-config label {
  display: grid;
  gap: 0.2rem;
  color: var(--label-text);
}

input[type='file'],
input[type='number'] {
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.42rem 0.5rem;
  background: #fff;
}

button {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  background: var(--action-primary);
  color: #fff;
}

.secondary {
  background: #0f4c81;
  color: #fff;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.badge {
  display: inline-block;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
}

.badge.active {
  background: #dcfce7;
  color: #166534;
}

.badge.inactive {
  background: #e2e8f0;
  color: #475569;
}

.file-meta {
  margin-top: 0.35rem;
  font-size: 0.74rem;
  color: #475569;
}

.ghost {
  background: #f3f4f6;
  color: #374151;
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

.status.info {
  background: #eff6ff;
  color: #1e40af;
}

.status.error {
  background: #fef2f2;
  color: #991b1b;
}
</style>
