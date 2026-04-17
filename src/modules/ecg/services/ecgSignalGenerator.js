const gaussian = (value, mean, deviation) => {
  const exponent = -((value - mean) ** 2) / (2 * deviation ** 2)
  return Math.exp(exponent)
}

export function createEcgSample(timeInSeconds, heartRate) {
  const cycle = ((timeInSeconds * heartRate) / 60) % 1

  const pWave = 0.12 * gaussian(cycle, 0.18, 0.035)
  const qWave = -0.18 * gaussian(cycle, 0.34, 0.015)
  const rWave = 1.35 * gaussian(cycle, 0.37, 0.012)
  const sWave = -0.35 * gaussian(cycle, 0.4, 0.015)
  const tWave = 0.35 * gaussian(cycle, 0.62, 0.06)

  const baselineWander = 0.04 * Math.sin(2 * Math.PI * timeInSeconds * 0.32)
  const respiratoryArtifact = 0.03 * Math.sin(2 * Math.PI * timeInSeconds * 0.18)
  const whiteNoise = (Math.random() - 0.5) * 0.04

  return pWave + qWave + rWave + sWave + tWave + baselineWander + respiratoryArtifact + whiteNoise
}
