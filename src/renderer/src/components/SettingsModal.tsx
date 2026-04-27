import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settings-store'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const settings = useSettingsStore((state) => state.form)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const updateField = useSettingsStore((state) => state.updateField)
  const saveSettings = useSettingsStore((state) => state.saveSettings)

  useEffect(() => {
    loadSettings()
  }, [])

  async function handleSave() {
    try {
      await saveSettings()
      onClose()
    } catch {}
  }

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
                <input className="field-input" value={settings[f.k as keyof typeof settings]} onChange={(e) => updateField(f.k as keyof typeof settings, e.target.value)} />
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
