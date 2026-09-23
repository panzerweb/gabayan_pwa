export function calculateRectangularArea(lengthM: number, widthM: number) {
  if (!Number.isFinite(lengthM) || !Number.isFinite(widthM) || lengthM <= 0 || widthM <= 0) {
    return null
  }
  return Number((lengthM * widthM).toFixed(2))
}

export function calculateRectangularVolume(lengthM: number, widthM: number, waterDepthM: number) {
  const area = calculateRectangularArea(lengthM, widthM)
  if (area === null || !Number.isFinite(waterDepthM) || waterDepthM <= 0) return null
  return Number((area * waterDepthM).toFixed(2))
}
