<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { listRecentPatients, savePatientProfileToDatabase } from '../services/patientProfileService'

const props = defineProps({
  patient: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-patient'])

const searchKeyword = ref('')
const patientOptions = ref([])
const isLoading = ref(false)
const loadError = ref('')
const isAddingPatient = ref(false)
const isSavingPatient = ref(false)
const saveError = ref('')
const saveInfo = ref('')

const newPatient = reactive({
  id: '',
  fullName: '',
  age: 0,
  sex: '',
  diagnosis: '',
  ward: '',
})

const filteredPatients = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return patientOptions.value
  }

  return patientOptions.value.filter((entry) => {
    return [entry.id, entry.fullName, entry.ward, entry.diagnosis]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword))
  })
})

const refreshPatients = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    patientOptions.value = await listRecentPatients(50)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Cannot load patients from database.'
  } finally {
    isLoading.value = false
  }
}

const resetNewPatientForm = () => {
  newPatient.id = ''
  newPatient.fullName = ''
  newPatient.age = 0
  newPatient.sex = ''
  newPatient.diagnosis = ''
  newPatient.ward = ''
}

const startAddPatient = () => {
  saveError.value = ''
  saveInfo.value = ''
  resetNewPatientForm()
  isAddingPatient.value = true
}

const cancelAddPatient = () => {
  isAddingPatient.value = false
  saveError.value = ''
  saveInfo.value = ''
  resetNewPatientForm()
}

const saveNewPatient = async () => {
  if (!newPatient.fullName.trim()) {
    saveError.value = 'Patient name is required.'
    return
  }

  isSavingPatient.value = true
  saveError.value = ''
  saveInfo.value = ''

  try {
    const saved = await savePatientProfileToDatabase(newPatient)
    saveInfo.value = `Patient ${saved.fullName} saved with ID ${saved.id}.`

    await refreshPatients()
    selectPatient(saved)
    isAddingPatient.value = false
    resetNewPatientForm()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save patient.'
  } finally {
    isSavingPatient.value = false
  }
}

const selectPatient = (entry) => {
  emit('select-patient', {
    id: entry.id,
    fullName: entry.fullName,
    age: entry.age,
    sex: entry.sex,
    diagnosis: entry.diagnosis,
    ward: entry.ward,
  })
}

const isSelectedPatient = (entry) => entry.id === props.patient.id

onMounted(() => {
  refreshPatients()
})
</script>

<template>
  <section class="panel patient-panel">
    <header class="panel-header">
      <h2>Patient Lookup</h2>
      <div class="header-actions">
        <button type="button" class="add-btn" @click="startAddPatient">Add New</button>
        <button type="button" class="refresh-btn" :disabled="isLoading" @click="refreshPatients">
          {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </header>

    <form v-if="isAddingPatient" class="add-form" @submit.prevent="saveNewPatient">
      <label>
        Patient ID (optional)
        <input v-model.trim="newPatient.id" type="text" placeholder="PT-2026-010" />
      </label>
      <label>
        Full Name
        <input v-model.trim="newPatient.fullName" type="text" required />
      </label>
      <label>
        Age
        <input v-model.number="newPatient.age" type="number" min="0" />
      </label>
      <label>
        Sex
        <input v-model.trim="newPatient.sex" type="text" placeholder="Male / Female" />
      </label>
      <label>
        Diagnosis
        <input v-model.trim="newPatient.diagnosis" type="text" />
      </label>
      <label>
        Ward
        <input v-model.trim="newPatient.ward" type="text" />
      </label>

      <div class="form-actions">
        <button type="submit" class="save-btn" :disabled="isSavingPatient">
          {{ isSavingPatient ? 'Saving...' : 'Save Patient' }}
        </button>
        <button type="button" class="cancel-btn" @click="cancelAddPatient">Cancel</button>
      </div>
    </form>

    <label class="search-label">
      Search patient (ID, name, ward, diagnosis)
      <input v-model.trim="searchKeyword" type="text" placeholder="PT-2026-001 or Nguyen" />
    </label>

    <p v-if="loadError" class="status error">{{ loadError }}</p>
    <p v-if="saveInfo" class="status ok">{{ saveInfo }}</p>
    <p v-if="saveError" class="status error">{{ saveError }}</p>

    <ul v-if="filteredPatients.length" class="patient-list">
      <li v-for="entry in filteredPatients.slice(0, 8)" :key="entry.id">
        <div>
          <p class="row-title">{{ entry.fullName }}</p>
          <p class="row-meta">{{ entry.id }} | {{ entry.ward || 'No ward' }}</p>
        </div>
        <button type="button" class="select-btn" :disabled="isSelectedPatient(entry)" @click="selectPatient(entry)">
          {{ isSelectedPatient(entry) ? 'Selected' : 'Select' }}
        </button>
      </li>
    </ul>

    <p v-else class="status info">No patient matches your search.</p>

    <div class="selected-profile">
      <div class="selected-head">
        <h3>Selected Profile</h3>
        <span class="chip">{{ patient.id }}</span>
      </div>

      <div class="patient-grid">
        <p><strong>Name</strong><span>{{ patient.fullName }}</span></p>
        <p><strong>Age</strong><span>{{ patient.age }}</span></p>
        <p><strong>Sex</strong><span>{{ patient.sex }}</span></p>
        <p><strong>Diagnosis</strong><span>{{ patient.diagnosis }}</span></p>
        <p><strong>Ward</strong><span>{{ patient.ward }}</span></p>
      </div>
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
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.refresh-btn,
.select-btn {
  border: none;
  border-radius: 9px;
  padding: 0.4rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.add-btn,
.save-btn,
.cancel-btn {
  border: none;
  border-radius: 9px;
  padding: 0.4rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.refresh-btn,
.select-btn {
  background: var(--action-secondary);
  color: #fff;
}

.add-btn,
.save-btn {
  background: var(--action-primary);
  color: #fff;
}

.cancel-btn {
  background: #e2e8f0;
  color: #334155;
}

.select-btn:disabled,
.refresh-btn:disabled,
.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-form {
  margin-top: 0.7rem;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 0.6rem;
  display: grid;
  gap: 0.45rem;
}

.add-form label {
  display: grid;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: var(--label-text);
}

.add-form input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
  background: #fff;
}

.form-actions {
  margin-top: 0.2rem;
  display: flex;
  gap: 0.45rem;
}

.patient-grid {
  margin-top: 0.8rem;
  display: grid;
  gap: 0.55rem;
}

.patient-grid p {
  margin: 0;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 0.75rem;
  font-size: 0.92rem;
}

strong {
  color: var(--label-text);
}

span {
  color: var(--body-text);
}

.search-label {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.22rem;
  font-size: 0.82rem;
  color: var(--label-text);
}

.search-label input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.42rem 0.55rem;
  font-size: 0.9rem;
  background: #fff;
}

.patient-list {
  list-style: none;
  padding: 0;
  margin: 0.65rem 0 0;
  display: grid;
  gap: 0.45rem;
}

.patient-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.55rem;
  background: #f8fafc;
}

.row-title {
  margin: 0;
  font-size: 0.84rem;
  color: #0f172a;
  font-weight: 700;
}

.row-meta {
  margin: 0.15rem 0 0;
  font-size: 0.76rem;
  color: #64748b;
}

.selected-profile {
  margin-top: 0.75rem;
  border-top: 1px dashed #cbd5e1;
  padding-top: 0.7rem;
}

.selected-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-head h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
}

.chip {
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--chip-bg);
  color: var(--chip-text);
}

.status {
  margin: 0.65rem 0 0;
  border-radius: 8px;
  padding: 0.42rem 0.5rem;
  font-size: 0.8rem;
}

.status.info {
  background: #eff6ff;
  color: #1e40af;
}

.status.ok {
  background: #ecfdf5;
  color: #065f46;
}

.status.error {
  background: #fef2f2;
  color: #991b1b;
}
</style>
