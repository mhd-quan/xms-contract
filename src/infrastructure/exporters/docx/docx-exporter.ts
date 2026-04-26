import JSZip from 'jszip'
import type { Exporter } from '../exporter'
import { normalizeDocxContentTypes } from './content-types'
import { escapeXml, replaceNextTextNode, replaceTextNodeContaining } from './xml-utils'

export interface DocxSpecialTextReplacements {
  contractNo: string
  signedDateLine: string | null
  signedDateLineEn: string | null
  termLine: string | null
  termLineEn: string | null
}

export interface DocxRenderInput {
  templateBinary: Uint8Array
  clickReplacements: readonly string[]
  specialTextReplacements: DocxSpecialTextReplacements
}

export class DocxExporter implements Exporter<DocxRenderInput, Uint8Array> {
  readonly id = 'docx'
  readonly fileExtension = '.docx'

  async export(input: DocxRenderInput): Promise<Uint8Array> {
    const zip = await JSZip.loadAsync(input.templateBinary)
    const documentPart = zip.file('word/document.xml')
    if (!documentPart) throw new Error('Template is missing word/document.xml')

    let documentXml = await documentPart.async('string')
    const specials = input.specialTextReplacements
    documentXml = replaceNextTextNode(documentXml, '………………', specials.contractNo)
    documentXml = documentXml.replace(/Điền số HD\./g, () => escapeXml(specials.contractNo))

    if (specials.signedDateLine) documentXml = replaceTextNodeContaining(documentXml, 'Hôm nay, ngày', specials.signedDateLine)
    if (specials.signedDateLineEn) documentXml = replaceTextNodeContaining(documentXml, 'Today, on', specials.signedDateLineEn)
    if (specials.termLine) documentXml = replaceTextNodeContaining(documentXml, 'kể từ ngày', specials.termLine)
    if (specials.termLineEn) documentXml = replaceTextNodeContaining(documentXml, 'from ................', specials.termLineEn)

    for (const replacement of input.clickReplacements) {
      documentXml = replaceNextTextNode(documentXml, 'Click điền thông tin.', replacement)
    }

    zip.file('word/document.xml', documentXml)
    const contentTypes = zip.file('[Content_Types].xml')
    if (contentTypes) {
      zip.file('[Content_Types].xml', normalizeDocxContentTypes(await contentTypes.async('string')))
    }

    return zip.generateAsync({ type: 'uint8array' })
  }
}
