import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { draftService, templateService } from '../services/xms-services'
import type { DraftSummary, TemplateManifestEntry } from '@shared/types'
import { coerceDocumentKind, DocumentKind } from '@shared/schema/document-kind'

const FALLBACK_TEMPLATES: TemplateManifestEntry[] = [
  {
    id: DocumentKind.ContractFullright,
    kind: DocumentKind.ContractFullright,
    name: 'Contract Fullright',
    subtitle: 'Background Music Service Agreement',
    version: '1.0.0',
    templateFile: 'contract-fullright.dotx'
  }
]

interface LibraryStoreState {
  templates: TemplateManifestEntry[]
  drafts: DraftSummary[]
  hoveredCard: string | null
  isLoading: boolean
  setHoveredCard: (id: string | null) => void
  loadData: () => Promise<void>
  createDraft: (templateId: string) => Promise<{ draftId: string; templateId: string }>
  deleteDraft: (id: string) => Promise<void>
}

export const useLibraryStore = create<LibraryStoreState>((set) => ({
  templates: [],
  drafts: [],
  hoveredCard: null,
  isLoading: false,
  setHoveredCard: (id) => set({ hoveredCard: id }),
  loadData: async () => {
    set({ isLoading: true })
    try {
      const [templates, drafts] = await Promise.all([
        templateService.list(),
        draftService.list()
      ])
      set({
        templates: templates.length ? templates : FALLBACK_TEMPLATES,
        drafts,
        isLoading: false
      })
    } catch {
      set({ templates: FALLBACK_TEMPLATES, isLoading: false })
    }
  },
  createDraft: async (templateId) => {
    const draftId = uuidv4()
    const now = new Date().toISOString()
    const kind = coerceDocumentKind(templateId)

    try {
      if (kind === DocumentKind.AnnexNewstore) {
        await draftService.save({
          id: draftId,
          kind: DocumentKind.AnnexNewstore,
          templateId: DocumentKind.AnnexNewstore,
          title: 'Untitled',
          createdAt: now,
          updatedAt: now,
          exportedPath: null,
          data: {}
        })
      } else {
        await draftService.save({
          id: draftId,
          kind: DocumentKind.ContractFullright,
          templateId: DocumentKind.ContractFullright,
          title: 'Untitled',
          createdAt: now,
          updatedAt: now,
          exportedPath: null,
          data: {}
        })
      }
    } catch {
      /* match the existing optimistic create flow */
    }

    return { draftId, templateId: kind }
  },
  deleteDraft: async (id) => {
    await draftService.delete(id)
    set((state) => ({ drafts: state.drafts.filter((draft) => draft.id !== id) }))
  }
}))
