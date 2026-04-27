import { create } from 'zustand'
import { settingsService } from '../services/xms-services'
import type { AppSettings } from '@shared/types'

interface SettingsFormState {
  bankAccount: string
  bankName: string
  bankBranch: string
  poaNo: string
  poaDate: string
  paymentBankAccount: string
  paymentBankName: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

const EMPTY_FORM: SettingsFormState = {
  bankAccount: '',
  bankName: '',
  bankBranch: '',
  poaNo: '',
  poaDate: '',
  paymentBankAccount: '',
  paymentBankName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: ''
}

interface SettingsStoreState {
  persistedSettings: AppSettings | null
  form: SettingsFormState
  loadSettings: () => Promise<void>
  updateField: (key: keyof SettingsFormState, value: string) => void
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  persistedSettings: null,
  form: EMPTY_FORM,
  loadSettings: async () => {
    try {
      const settings = await settingsService.get()
      set({
        persistedSettings: settings,
        form: {
          bankAccount: settings.partyA.bankAccount || '',
          bankName: settings.partyA.bankName || '',
          bankBranch: settings.partyA.bankBranch || '',
          poaNo: settings.partyA.poaNo || '',
          poaDate: settings.partyA.poaDate || '',
          paymentBankAccount: settings.partyA.paymentBankAccount || '',
          paymentBankName: settings.partyA.paymentBankName || '',
          contactName: settings.defaults?.defaultContactA?.name || '',
          contactEmail: settings.defaults?.defaultContactA?.email || '',
          contactPhone: settings.defaults?.defaultContactA?.phone || ''
        }
      })
    } catch {
      set({ form: EMPTY_FORM })
    }
  },
  updateField: (key, value) => {
    set((state) => ({ form: { ...state.form, [key]: value } }))
  },
  saveSettings: async () => {
    const { form, persistedSettings } = get()
    const defaults = persistedSettings?.defaults ?? {
      vatPct: 10,
      defaultContactA: { name: '', email: '', phone: '' }
    }

    await settingsService.save({
      partyA: {
        bankAccount: form.bankAccount,
        bankName: form.bankName,
        bankBranch: form.bankBranch,
        poaNo: form.poaNo,
        poaDate: form.poaDate,
        paymentBankAccount: form.paymentBankAccount,
        paymentBankName: form.paymentBankName
      },
      defaults: {
        ...defaults,
        defaultContactA: {
          name: form.contactName,
          email: form.contactEmail,
          phone: form.contactPhone
        }
      },
      ui: persistedSettings?.ui ?? { lastFormPaneWidthPct: 42, previewSyncScroll: false }
    })
  }
}))
