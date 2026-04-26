export function deriveDraftTitle(data: Readonly<Record<string, string>>): string {
  const contractNo = data['meta.contractNo']?.trim()
  const partyName = data['partyB.name']?.trim()
  if (contractNo && partyName) return `${contractNo} · ${partyName}`
  if (contractNo) return contractNo
  if (partyName) return partyName
  return 'Untitled'
}
