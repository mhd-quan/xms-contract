export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function replaceNextTextNode(xml: string, text: string, replacement: string): string {
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return xml.replace(
    new RegExp(`<w:t([^>]*)>${escapedText}</w:t>`),
    (_match, attrs: string) => `<w:t${attrs}>${escapeXml(replacement)}</w:t>`
  )
}

export function replaceTextNodeContaining(xml: string, needle: string, replacement: string): string {
  const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`<w:t([^>]*)>[^<]*${escapedNeedle}[^<]*</w:t>`)
  return xml.replace(pattern, (_match, attrs: string) => `<w:t${attrs}>${escapeXml(replacement)}</w:t>`)
}
