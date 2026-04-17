<script setup>
defineProps({
  alerts: {
    type: Array,
    required: true,
  },
  thresholds: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="panel alerts-panel">
    <header class="panel-header">
      <h2>Clinical Alerts</h2>
      <p>
        Thresholds: <strong>{{ thresholds.minHeartRate }}</strong> to
        <strong>{{ thresholds.maxHeartRate }}</strong> BPM
      </p>
    </header>

    <ul>
      <li v-for="item in alerts" :key="item.id" :class="['alert-item', item.severity]">
        <span class="severity">{{ item.severity }}</span>
        <p>{{ item.message }}</p>
      </li>
    </ul>
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

.panel-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.panel-header p {
  margin: 0.35rem 0 0;
  color: var(--muted-text);
  font-size: 0.9rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  display: grid;
  gap: 0.6rem;
}

.alert-item {
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
  border: 1px solid transparent;
}

.alert-item p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.severity {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.7rem;
  font-weight: 700;
}

.info {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0c4a6e;
}

.warning {
  background: #fffbeb;
  border-color: #fde68a;
  color: #7c2d12;
}

.critical {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #881337;
}
</style>
