import { create } from 'zustand'
import type { AppView } from '@shared/types'

interface AppStoreState {
  view: AppView
  showSettings: boolean
  navigateToForm: (draftId: string, templateId: string) => void
  navigateToLibrary: () => void
  openSettings: () => void
  closeSettings: () => void
  toggleSettings: () => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  view: { type: 'library' },
  showSettings: false,
  navigateToForm: (draftId, templateId) => set({ view: { type: 'form', draftId, templateId } }),
  navigateToLibrary: () => set({ view: { type: 'library' } }),
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings }))
}))
