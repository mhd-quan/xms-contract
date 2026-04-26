export function normalizeDocxContentTypes(xml: string): string {
  return xml.replace(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
  )
}
