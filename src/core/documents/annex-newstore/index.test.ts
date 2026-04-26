import { describe, expect, it } from 'vitest'
import { DocumentKind } from '@shared/schema/document-kind'
import { getDocumentLogic } from '../registry'

describe('annex-newstore logic stub', () => {
  it('returns stable empty objects until the annex spec arrives', () => {
    const logic = getDocumentLogic(DocumentKind.AnnexNewstore)
    const form = logic.normalizeFormData({ ignored: true })
    const preview = logic.buildPreviewModel(form)
    const replacements = logic.buildReplacements(form, preview)

    expect(logic.kind).toBe(DocumentKind.AnnexNewstore)
    expect(form).toEqual({})
    expect(logic.deriveDraftTitle(form)).toBe('Annex New Store')
    expect(preview).toEqual({})
    expect(replacements).toEqual({
      clickReplacements: {},
      specialTextReplacements: {}
    })
  })
})
