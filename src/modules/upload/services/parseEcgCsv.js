const ECG_HEADER_HINTS = ['ecg', 'signal', 'amplitude', 'value', 'lead', 'ii']

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim().replace(/\s+/g, '')
  if (!normalized.length) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const hasHeaderRow = (firstRow) => {
  if (!firstRow) {
    return false
  }

  const numericCount = firstRow.filter((item) => toNumberOrNull(item) !== null).length
  return numericCount === 0
}

const pickTargetColumn = ({ headerRow, dataRows }) => {
  if (!dataRows.length) {
    return 0
  }

  if (headerRow?.length) {
    const hintedIndex = headerRow.findIndex((column) => {
      const lowerName = String(column).toLowerCase()
      return ECG_HEADER_HINTS.some((hint) => lowerName.includes(hint))
    })

    if (hintedIndex >= 0) {
      return hintedIndex
    }
  }

  const maxColumnCount = Math.max(...dataRows.map((row) => row.length))
  const statsByColumn = Array.from({ length: maxColumnCount }, () => [])

  dataRows.forEach((row) => {
    row.forEach((cell, index) => {
      const numberValue = toNumberOrNull(cell)
      if (numberValue !== null) {
        statsByColumn[index].push(numberValue)
      }
    })
  })

  const getScore = (values) => {
    if (values.length < 5) {
      return -Infinity
    }

    const mean = values.reduce((acc, current) => acc + current, 0) / values.length
    const variance = values.reduce((acc, current) => acc + (current - mean) ** 2, 0) / values.length
    const std = Math.sqrt(variance)

    let monotonicSteps = 0
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] >= values[index - 1]) {
        monotonicSteps += 1
      }
    }

    const monotonicRatio = monotonicSteps / Math.max(1, values.length - 1)
    const monotonicPenalty = monotonicRatio > 0.95 ? 0.25 : 1
    return std * monotonicPenalty
  }

  let bestIndex = 0
  let bestScore = -Infinity

  statsByColumn.forEach((values, index) => {
    const score = getScore(values)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestIndex
}

const normalizeSignal = (samples) => {
  if (!samples.length) {
    return []
  }

  let min = Infinity
  let max = -Infinity

  samples.forEach((value) => {
    if (value < min) {
      min = value
    }
    if (value > max) {
      max = value
    }
  })

  const range = max - min

  if (range === 0) {
    return samples.map(() => 0)
  }

  return samples.map((value) => {
    const scaled = ((value - min) / range) * 2 - 1
    return Number((scaled * 1.45).toFixed(4))
  })
}

const estimateHeartRate = (samples, samplingRate) => {
  if (!samples.length || samplingRate <= 0) {
    return 0
  }

  const mean = samples.reduce((acc, current) => acc + current, 0) / samples.length
  const variance = samples.reduce((acc, current) => acc + (current - mean) ** 2, 0) / samples.length
  const std = Math.sqrt(variance)
  const threshold = mean + std * 0.75

  let peakCount = 0
  let lastPeakIndex = -Infinity
  const refractorySamples = Math.floor(0.25 * samplingRate)

  for (let index = 1; index < samples.length - 1; index += 1) {
    const prev = samples[index - 1]
    const current = samples[index]
    const next = samples[index + 1]

    const isPeak = current > threshold && current > prev && current > next
    if (!isPeak) {
      continue
    }

    if (index - lastPeakIndex < refractorySamples) {
      continue
    }

    peakCount += 1
    lastPeakIndex = index
  }

  const durationSeconds = samples.length / samplingRate
  if (durationSeconds <= 0) {
    return 0
  }

  return Math.max(0, Math.round((peakCount * 60) / durationSeconds))
}

export function parseEcgCsv(csvText, samplingRate = 250) {
  const sanitizedLines = String(csvText)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (!sanitizedLines.length) {
    throw new Error('CSV file is empty.')
  }

  const table = sanitizedLines.map((line) => line.split(/[;,\t]+/).map((cell) => cell.trim()))
  const headerRow = hasHeaderRow(table[0]) ? table[0] : null
  const dataRows = headerRow ? table.slice(1) : table

  if (!dataRows.length) {
    throw new Error('CSV file does not contain data rows.')
  }

  const targetColumn = pickTargetColumn({ headerRow, dataRows })
  const rawSamples = dataRows
    .map((row) => toNumberOrNull(row[targetColumn]))
    .filter((value) => value !== null)

  if (rawSamples.length < 20) {
    throw new Error('Not enough numeric ECG samples in file. Minimum is 20.')
  }

  const normalizedSamples = normalizeSignal(rawSamples)
  const estimatedHeartRate = estimateHeartRate(normalizedSamples, samplingRate)

  return {
    samples: normalizedSamples,
    sampleCount: normalizedSamples.length,
    estimatedHeartRate,
    samplingRate,
    columnIndex: targetColumn,
    hasHeader: Boolean(headerRow),
  }
}
