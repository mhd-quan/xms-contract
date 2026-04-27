import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  normalizeFormData,
  normalizeStores,
  type NormalizedStoreRow,
  type StoreRowData
} from '@core/documents/contract-fullright'
import { coerceDocumentKind, DocumentKind, type DocumentKind as DocumentKindType } from '@shared/schema/document-kind'
import type { DraftSaveRequestInput } from '@shared/ipc/contracts'
import type { Draft } from '@shared/types'
import { draftService } from '../../services/xms-services'
import { ANNEX_NEWSTORE_INITIAL_DATA } from './annex-newstore-actions'
import {
  createStoreRow,
  deleteStoreRow as deleteContractStoreRow,
  updateStoreRows
} from './contract-fullright-actions'

interface DraftStoreState {
  draftId: string | null
  kind: DocumentKindType | null
  formData: Record<string, string>
  stores: NormalizedStoreRow[]
  createdAt: string | null
  exportedPath: string | null
  isDirty: boolean
  isHydrated: boolean
  lastSavedAt: string | null
  loadDraft: (draftId: string, kind: DocumentKindType) => Promise<void>
  hydrateFrom: (draftId: string, kind: DocumentKindType, draft: Draft | null) => void
  setField: (key: string, value: string) => void
  addStoreRow: () => void
  updateStoreRow: (id: string, key: keyof Omit<StoreRowData, 'id'>, value: string) => void
  deleteStoreRow: (id: string) => void
  saveCurrentDraft: (title: string, nextExportedPath?: string | null) => Promise<void>
  reset: () => void
}

const INITIAL_STATE = {
  draftId: null,
  kind: null,
  formData: {},
  stores: [],
  createdAt: null,
  exportedPath: null,
  isDirty: false,
  isHydrated: false,
  lastSavedAt: null
}

function buildDraftPayload(
  state: Pick<DraftStoreState, 'draftId' | 'kind' | 'formData' | 'stores' | 'createdAt' | 'exportedPath'>,
  title: string,
  nextExportedPath = state.exportedPath
): DraftSaveRequestInput | null {
  if (!state.draftId || !state.kind) return null

  const now = new Date().toISOString()
  if (state.kind === DocumentKind.AnnexNewstore) {
    return {
      id: state.draftId,
      kind: DocumentKind.AnnexNewstore,
      templateId: DocumentKind.AnnexNewstore,
      title,
      createdAt: state.createdAt ?? now,
      updatedAt: now,
      exportedPath: nextExportedPath,
      data: ANNEX_NEWSTORE_INITIAL_DATA
    }
  }

  return {
    id: state.draftId,
    kind: DocumentKind.ContractFullright,
    templateId: DocumentKind.ContractFullright,
    title,
    createdAt: state.createdAt ?? now,
    updatedAt: now,
    exportedPath: nextExportedPath,
    data: { ...state.formData, stores: state.stores }
  }
}

export const useDraftStore = create<DraftStoreState>((set, get) => ({
  ...INITIAL_STATE,
  loadDraft: async (draftId, kind) => {
    set({ ...INITIAL_STATE, draftId, kind, isHydrated: false })
    try {
      const draft = await draftService.load(draftId)
      get().hydrateFrom(draftId, kind, draft)
    } catch {
      get().hydrateFrom(draftId, kind, null)
    }
  },
  hydrateFrom: (draftId, fallbackKind, draft) => {
    const kind = coerceDocumentKind(draft?.kind, fallbackKind)
    set({
      draftId,
      kind,
      formData: kind === DocumentKind.ContractFullright ? normalizeFormData(draft?.data) : {},
      stores: kind === DocumentKind.ContractFullright ? normalizeStores(draft?.data, uuidv4) : [],
      createdAt: draft?.createdAt ?? null,
      exportedPath: draft?.exportedPath ?? null,
      isDirty: false,
      isHydrated: true,
      lastSavedAt: null
    })
  },
  setField: (key, value) => {
    set((state) => ({
      formData: { ...state.formData, [key]: value },
      isDirty: true
    }))
  },
  addStoreRow: () => {
    set((state) => ({
      stores: [...state.stores, createStoreRow(uuidv4)],
      isDirty: true
    }))
  },
  updateStoreRow: (id, key, value) => {
    set((state) => ({
      stores: updateStoreRows(state.stores, id, key, value),
      isDirty: true
    }))
  },
  deleteStoreRow: (id) => {
    set((state) => ({
      stores: deleteContractStoreRow(state.stores, id),
      isDirty: true
    }))
  },
  saveCurrentDraft: async (title, nextExportedPath) => {
    const state = get()
    const payload = buildDraftPayload(state, title, nextExportedPath)
    if (!payload) return

    const result = await draftService.save(payload)
    set({
      createdAt: payload.createdAt ?? state.createdAt,
      exportedPath: payload.exportedPath ?? null,
      isDirty: false,
      lastSavedAt: result.savedAt
    })
  },
  reset: () => set(INITIAL_STATE)
}))
