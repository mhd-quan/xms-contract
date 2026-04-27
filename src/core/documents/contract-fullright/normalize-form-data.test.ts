import { describe, expect, it } from 'vitest'
import { normalizeContractFullrightForm, normalizeFormData } from './normalize-form-data'

describe('normalize contract-fullright form data', () => {
  it('keeps renderer form data to editable text fields only', () => {
    const formData = normalizeFormData({
      'meta.contractNo': 'HD-001',
      'pricing.relatedRights.month': 100000,
      vatPct: '10',
      stores: [{ name: 'Store 1' }]
    })

    expect(formData['meta.contractNo']).toBe('HD-001')
    expect(formData['pricing.relatedRights.month']).toBe('100000')
    expect(formData).not.toHaveProperty('vatPct')
    expect(formData).not.toHaveProperty('stores')
  })

  it('normalizes persisted vatPct separately from editable text fields', () => {
    const form = normalizeContractFullrightForm({
      'meta.contractNo': 'HD-001',
      vatPct: '8',
      stores: [{ id: 'store-1', name: 'Store 1', months: 12 }]
    })

    expect(form.vatPct).toBe(8)
    expect(form.stores).toEqual([
      { id: 'store-1', name: 'Store 1', address: '', usingTerm: '', months: '12' }
    ])
  })
})
