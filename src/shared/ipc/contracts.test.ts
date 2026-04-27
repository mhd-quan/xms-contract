import { describe, expect, it } from 'vitest'
import {
  DraftSaveRequest,
  RenderDocxRequest,
  RenderSaveAsRequest,
  SettingsSaveRequest,
  TemplateListResponse
} from './contracts'
import { DocumentKind } from '../schema/document-kind'

describe('IPC contracts', () => {
  it('parses discriminated contract-fullright draft saves with default form fields', () => {
    const parsed = DraftSaveRequest.parse({
      id: 'draft-1',
      kind: DocumentKind.ContractFullright,
      title: 'Untitled',
      data: {}
    })

    expect(parsed.templateId).toBeUndefined()
    if (parsed.kind !== DocumentKind.ContractFullright) throw new Error('Expected contract-fullright payload')
    expect(parsed.data['meta.contractNo']).toBe('')
    expect(parsed.data.stores).toEqual([])
  })

  it('rejects mismatched document kind discriminators', () => {
    const result = RenderDocxRequest.safeParse({
      kind: DocumentKind.AnnexNewstore,
      templateId: DocumentKind.ContractFullright,
      data: {}
    })

    expect(result.success).toBe(false)
  })

  it('requires saveAs request object shape', () => {
    expect(RenderSaveAsRequest.parse({ tempPath: '/tmp/a.docx', suggestedName: 'a.docx' })).toEqual({
      tempPath: '/tmp/a.docx',
      suggestedName: 'a.docx'
    })
    expect(RenderSaveAsRequest.safeParse('/tmp/a.docx').success).toBe(false)
  })

  it('validates settings and template list responses', () => {
    expect(SettingsSaveRequest.safeParse({}).success).toBe(false)
    expect(TemplateListResponse.parse([{
      id: DocumentKind.ContractFullright,
      kind: DocumentKind.ContractFullright,
      name: 'Contract Fullright',
      subtitle: 'Background Music Service Agreement',
      version: '1.0.0',
      templateFile: 'contract-fullright.template.docx'
    }])).toHaveLength(1)
  })
})
