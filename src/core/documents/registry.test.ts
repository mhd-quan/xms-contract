import { describe, expect, it } from 'vitest'
import { DOCUMENT_KINDS, DocumentKind } from '@shared/schema/document-kind'
import { DOCUMENT_REGISTRY, getDocumentKinds, getDocumentLogic } from './registry'

describe('document registry', () => {
  it('registers every canonical document kind', () => {
    expect(Object.keys(DOCUMENT_REGISTRY).sort()).toEqual([...DOCUMENT_KINDS].sort())
    expect(getDocumentKinds()).toEqual(DOCUMENT_KINDS)
  })

  it('returns a complete logic object for each document kind', () => {
    for (const kind of DOCUMENT_KINDS) {
      const logic = getDocumentLogic(kind)

      expect(logic.kind).toBe(kind)
      expect(logic.normalizeFormData).toEqual(expect.any(Function))
      expect(logic.deriveDraftTitle).toEqual(expect.any(Function))
      expect(logic.buildPreviewModel).toEqual(expect.any(Function))
      expect(logic.buildReplacements).toEqual(expect.any(Function))
    }
  })

  it('keeps contract-fullright logic wired to ordered template replacements', () => {
    const logic = getDocumentLogic(DocumentKind.ContractFullright)
    const form = logic.normalizeFormData({
      'meta.contractNo': 'HD-1',
      'partyB.name': 'Client A',
      stores: [{ id: 'store-1', name: 'Store 1', address: 'Address 1', usingTerm: '12 months', months: '12' }]
    })
    const preview = logic.buildPreviewModel(form)
    const replacements = logic.buildReplacements(form, preview)

    expect(preview.contractNo).toBe('HD-1')
    expect(logic.deriveDraftTitle(form)).toBe('HD-1 · Client A')
    expect(Array.isArray(replacements.clickReplacements)).toBe(true)
    expect(replacements.specialTextReplacements.contractNo).toBe('HD-1')
  })
})
