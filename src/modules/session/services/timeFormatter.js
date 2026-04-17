export function formatDuration(totalSeconds) {
  const safeValue = Math.max(0, totalSeconds)
  const minutes = String(Math.floor(safeValue / 60)).padStart(2, '0')
  const seconds = String(safeValue % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function formatSnapshotTime(isoString) {
  return new Date(isoString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
