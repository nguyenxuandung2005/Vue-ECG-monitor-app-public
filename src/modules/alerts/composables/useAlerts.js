import { computed, reactive } from 'vue'

export function useAlerts({ heartRate, leadConnected, isRunning }) {
  const thresholds = reactive({
    minHeartRate: 55,
    maxHeartRate: 120,
  })

  const alerts = computed(() => {
    const entries = []

    if (!leadConnected.value) {
      entries.push({
        id: 'lead-off',
        severity: 'critical',
        message: 'ECG lead is disconnected. Reconnect electrodes to resume monitoring.',
      })
      return entries
    }

    if (!isRunning.value) {
      entries.push({
        id: 'monitor-standby',
        severity: 'info',
        message: 'Monitor is in standby mode. Start monitoring to stream data.',
      })
      return entries
    }

    if (heartRate.value < thresholds.minHeartRate) {
      entries.push({
        id: 'bradycardia-risk',
        severity: 'warning',
        message: `Heart rate is low (${heartRate.value} BPM). Review patient status.`,
      })
    }

    if (heartRate.value > thresholds.maxHeartRate) {
      entries.push({
        id: 'tachycardia-risk',
        severity: 'warning',
        message: `Heart rate is high (${heartRate.value} BPM). Confirm signal and assess patient.`,
      })
    }

    if (!entries.length) {
      entries.push({
        id: 'stable-rhythm',
        severity: 'info',
        message: 'Rhythm is currently within configured thresholds.',
      })
    }

    return entries
  })

  const updateThresholds = ({ minHeartRate, maxHeartRate }) => {
    if (Number.isFinite(minHeartRate)) {
      thresholds.minHeartRate = minHeartRate
    }
    if (Number.isFinite(maxHeartRate)) {
      thresholds.maxHeartRate = maxHeartRate
    }
  }

  return {
    alerts,
    thresholds,
    updateThresholds,
  }
}
