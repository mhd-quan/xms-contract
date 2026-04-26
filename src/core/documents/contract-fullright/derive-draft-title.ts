function getText(data: Readonly<Record<string, unknown>>, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function deriveDraftTitle(data: Readonly<Record<string, unknown>>): string {
  const contractNo = getText(data, 'meta.contractNo')
  const partyName = getText(data, 'partyB.name')
  if (contractNo && partyName) return `${contractNo} · ${partyName}`
  if (contractNo) return contractNo
  if (partyName) return partyName
  return 'Untitled'
}
