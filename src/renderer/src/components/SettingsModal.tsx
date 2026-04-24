import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState({
    bankAccount: '', bankName: '', bankBranch: '',
    poaNo: '', poaDate: '',
    paymentBankAccount: '', paymentBankName: '',
    contactName: '', contactEmail: '', contactPhone: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const s = await window.api.getSettings()
      if (s?.partyA) {
        setSettings({
          bankAccount: s.partyA.bankAccount || '',
          bankName: s.partyA.bankName || '',
          bankBranch: s.partyA.bankBranch || '',
          poaNo: s.partyA.poaNo || '',
          poaDate: s.partyA.poaDate || '',
          paymentBankAccount: s.partyA.paymentBankAccount || '',
          paymentBankName: s.partyA.paymentBankName || '',
          contactName: s.defaults?.defaultContactA?.name || '',
          contactEmail: s.defaults?.defaultContactA?.email || '',
          contactPhone: s.defaults?.defaultContactA?.phone || ''
        })
      }
    } catch {}
  }

  async function handleSave() {
    try {
      await window.api.saveSettings({
        partyA: {
          bankAccount: settings.bankAccount, bankName: settings.bankName, bankBranch: settings.bankBranch,
          poaNo: settings.poaNo, poaDate: settings.poaDate,
          paymentBankAccount: settings.paymentBankAccount, paymentBankName: settings.paymentBankName
        },
        defaults: { vatPct: 10, defaultContactA: { name: settings.contactName, email: settings.contactEmail, phone: settings.contactPhone } },
        ui: { lastFormPaneWidthPct: 42, previewSyncScroll: false }
      })
      onClose()
    } catch {}
  }

  function update(key: string, val: string) { setSettings((p) => ({ ...p, [key]: val })) }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-overlay" />
      <div className="modal-content settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div><h3>Cài đặt</h3><div className="modal-kicker">Party A · NCT identity</div></div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body quote-form-body">
          <div className="settings-grid">
            {[
              {k:'bankAccount',l:'STK BÊN A'},{k:'bankName',l:'NGÂN HÀNG'},{k:'bankBranch',l:'CHI NHÁNH'},
              {k:'poaNo',l:'SỐ GUQ'},{k:'poaDate',l:'NGÀY GUQ'},
              {k:'paymentBankAccount',l:'STK THANH TOÁN'},{k:'paymentBankName',l:'NH THANH TOÁN'},
              {k:'contactName',l:'LIÊN LẠC — TÊN'},{k:'contactEmail',l:'EMAIL'},{k:'contactPhone',l:'PHONE'}
            ].map(f => (
              <label key={f.k} className="settings-field">
                <span className="field-label">{f.l}</span>
                <input className="field-input" value={settings[f.k as keyof typeof settings]} onChange={(e) => update(f.k, e.target.value)} />
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer settings-footer">
          <button className="secondary-btn" onClick={onClose}>Hủy</button>
          <button className="primary-btn" onClick={handleSave}>Lưu cài đặt</button>
        </div>
      </div>
    </div>
  )
}
