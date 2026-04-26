import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { DocxExporter } from './docx-exporter'

async function createTemplate(): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('[Content_Types].xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml')
  zip.file('word/document.xml', [
    '<w:document><w:body>',
    '<w:t>………………</w:t>',
    '<w:t>Hôm nay, ngày …… tháng …… năm 20…, tại TP. Hồ Chí Minh, chúng tôi gồm có:</w:t>',
    '<w:t>Click điền thông tin.</w:t>',
    '</w:body></w:document>'
  ].join(''))
  return zip.generateAsync({ type: 'uint8array' })
}

describe('DocxExporter', () => {
  it('exports a valid docx zip with replaced document.xml', async () => {
    const output = await new DocxExporter().export({
      templateBinary: await createTemplate(),
      clickReplacements: ['Party B'],
      specialTextReplacements: {
        contractNo: 'HD-1',
        signedDateLine: 'Hôm nay, ngày 26 tháng 04 năm 2026, tại TP. Hồ Chí Minh, chúng tôi gồm có:',
        signedDateLineEn: null,
        termLine: null,
        termLineEn: null
      }
    })
    const zip = await JSZip.loadAsync(output)

    await expect(zip.file('word/document.xml')?.async('string')).resolves.toContain('Party B')
    await expect(zip.file('word/document.xml')?.async('string')).resolves.toContain('HD-1')
    await expect(zip.file('[Content_Types].xml')?.async('string')).resolves.toContain('document.main+xml')
  })
})
