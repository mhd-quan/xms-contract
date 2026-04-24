import { useState } from 'react'
import Rack from '../components/Rack'
import StatusBar from '../components/StatusBar'

interface Props {
  draftId: string
  templateId: string
  onBack: () => void
  onOpenSettings: () => void
}

export default function FormView({ draftId, templateId, onBack, onOpenSettings }: Props) {
  const [activeTab, setActiveTab] = useState<'main' | 'app1' | 'app2'>('main')
  const [formData, setFormData] = useState<Record<string, string>>({})

  const filledCount = Object.values(formData).filter(Boolean).length
  const totalFields = 45
  const completeness = Math.round((filledCount / totalFields) * 100)

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="form-shell">
      <header className="form-topbar">
        <div className="form-topbar-left">
          <button className="form-back-btn" onClick={onBack} title="Back to Library">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <div className="form-breadcrumb">
            <span className="bc-dim">XMS</span><span className="bc-sep">/</span>
            <span className="bc-active">{templateId === 'contract-fullright' ? 'Contract Fullright' : templateId}</span>
            <span className="bc-sep">›</span>
            <span className="bc-active">Draft: {formData['meta.contractNo'] || draftId.slice(0, 8)}</span>
          </div>
        </div>
        <div className="form-topbar-right">
          <button className="lib-settings-btn" onClick={onOpenSettings}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9c.27.68.87 1.15 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      <div className="form-split">
        <div className="form-pane">
          <div className="form-scroll">
            <Rack id="meta" title="CONTRACT METADATA" filled={formData['meta.contractNo'] ? 1 : 0} total={2} defaultOpen cueColor="picton" index={0}>
              <div className="rack-grid">
                <div className="rack-field">
                  <label className="field-label">SỐ HỢP ĐỒNG</label>
                  <input className="field-input" placeholder="HD-2026-..." value={formData['meta.contractNo'] || ''} onChange={(e) => updateField('meta.contractNo', e.target.value)} />
                </div>
                <div className="rack-field">
                  <label className="field-label">NGÀY KÝ</label>
                  <input className="field-input" type="date" value={formData['meta.signedDate'] || ''} onChange={(e) => updateField('meta.signedDate', e.target.value)} />
                </div>
              </div>
            </Rack>

            <Rack id="partyB" title="PARTY B IDENTITY" filled={['partyB.name','partyB.address','partyB.taxCode','partyB.phone','partyB.representative','partyB.position'].filter(k => formData[k]).length} total={6} cueColor="rose" index={1}>
              <div className="rack-grid cols-2">
                {[{k:'partyB.name',l:'TÊN CÔNG TY',p:'Công ty TNHH...'},{k:'partyB.address',l:'ĐỊA CHỈ',p:'Số ..., Quận ..., TP...'},{k:'partyB.taxCode',l:'MÃ SỐ THUẾ',p:'0123456789'},{k:'partyB.phone',l:'ĐIỆN THOẠI',p:'090...'},{k:'partyB.representative',l:'ĐẠI DIỆN',p:'Nguyễn Văn A'},{k:'partyB.position',l:'CHỨC VỤ',p:'Giám đốc'}].map(f => (
                  <div key={f.k} className={`rack-field${f.k === 'partyB.name' || f.k === 'partyB.address' ? ' wide' : ''}`}>
                    <label className="field-label">{f.l}</label>
                    <input className="field-input" placeholder={f.p} value={formData[f.k] || ''} onChange={(e) => updateField(f.k, e.target.value)} />
                  </div>
                ))}
              </div>
            </Rack>

            <Rack id="partyBBank" title="PARTY B BANK" filled={['partyB.bankAccount','partyB.bankName','partyB.bankBranch'].filter(k => formData[k]).length} total={3} cueColor="gold" index={2}>
              <div className="rack-grid cols-3">
                {[{k:'partyB.bankAccount',l:'SỐ TÀI KHOẢN',p:'...'},{k:'partyB.bankName',l:'NGÂN HÀNG',p:'VCB, ACB...'},{k:'partyB.bankBranch',l:'CHI NHÁNH',p:'CN HCM...'}].map(f => (
                  <div key={f.k} className="rack-field"><label className="field-label">{f.l}</label><input className="field-input" placeholder={f.p} value={formData[f.k] || ''} onChange={(e) => updateField(f.k, e.target.value)} /></div>
                ))}
              </div>
            </Rack>

            <Rack id="term" title="TERM" filled={['term.startDate','term.endDate'].filter(k => formData[k]).length} total={2} cueColor="green" index={3}>
              <div className="rack-grid cols-2">
                <div className="rack-field"><label className="field-label">NGÀY BẮT ĐẦU</label><input className="field-input" type="date" value={formData['term.startDate'] || ''} onChange={(e) => updateField('term.startDate', e.target.value)} /></div>
                <div className="rack-field"><label className="field-label">NGÀY KẾT THÚC</label><input className="field-input" type="date" value={formData['term.endDate'] || ''} onChange={(e) => updateField('term.endDate', e.target.value)} /></div>
              </div>
            </Rack>

            <Rack id="pricing" title="SERVICE PRICING" filled={['pricing.relatedRights.year','pricing.relatedRights.month','pricing.composition.year','pricing.composition.month','pricing.account.year','pricing.account.month','pricing.app.year','pricing.web.year','pricing.device.year'].filter(k => formData[k]).length} total={9} cueColor="daw-orange" index={4}>
              <div className="rack-grid cols-2">
                {[{k:'pricing.relatedRights.year',l:'Q. LIÊN QUAN (NĂM)',p:'VND/cửa hàng/năm'},{k:'pricing.relatedRights.month',l:'Q. LIÊN QUAN (THÁNG)',p:'VND/cửa hàng/tháng'},{k:'pricing.composition.year',l:'Q. TÁC GIẢ (NĂM)',p:'VND'},{k:'pricing.composition.month',l:'Q. TÁC GIẢ (THÁNG)',p:'VND'},{k:'pricing.account.year',l:'PHÍ TÀI KHOẢN (NĂM)',p:'VND'},{k:'pricing.account.month',l:'PHÍ TÀI KHOẢN (THÁNG)',p:'VND'},{k:'pricing.app.year',l:'PHÍ ỨNG DỤNG (NĂM)',p:'VND'},{k:'pricing.web.year',l:'PHÍ WEBSITE (NĂM)',p:'VND'},{k:'pricing.device.year',l:'PHÍ THIẾT BỊ (NĂM)',p:'VND'}].map(f => (
                  <div key={f.k} className="rack-field"><label className="field-label">{f.l}</label><input className="field-input" type="number" placeholder={f.p} value={formData[f.k] || ''} onChange={(e) => updateField(f.k, e.target.value)} /></div>
                ))}
              </div>
            </Rack>

            <Rack id="invoice" title="VAT INVOICE INFO" filled={['invoice.company','invoice.address','invoice.taxCode'].filter(k => formData[k]).length} total={3} cueColor="violet" index={5}>
              <div className="rack-grid cols-1">
                {[{k:'invoice.company',l:'TÊN ĐƠN VỊ',p:'...'},{k:'invoice.address',l:'ĐỊA CHỈ XUẤT HĐ',p:'...'},{k:'invoice.taxCode',l:'MST XUẤT HĐ',p:'...'}].map(f => (
                  <div key={f.k} className="rack-field"><label className="field-label">{f.l}</label><input className="field-input" placeholder={f.p} value={formData[f.k] || ''} onChange={(e) => updateField(f.k, e.target.value)} /></div>
                ))}
              </div>
            </Rack>

            <Rack id="contacts" title="CONTACT PERSONS" filled={['contact.a.name','contact.a.email','contact.a.phone','contact.b.name','contact.b.email','contact.b.phone'].filter(k => formData[k]).length} total={6} cueColor="teal" index={6}>
              <div className="rack-grid cols-2">
                {[{k:'contact.a.name',l:'BÊN A — TÊN'},{k:'contact.a.email',l:'BÊN A — EMAIL'},{k:'contact.a.phone',l:'BÊN A — PHONE'},{k:'contact.b.name',l:'BÊN B — TÊN'},{k:'contact.b.email',l:'BÊN B — EMAIL'},{k:'contact.b.phone',l:'BÊN B — PHONE'}].map(f => (
                  <div key={f.k} className="rack-field"><label className="field-label">{f.l}</label><input className="field-input" value={formData[f.k] || ''} onChange={(e) => updateField(f.k, e.target.value)} /></div>
                ))}
              </div>
            </Rack>

            <Rack id="stores" title="STORE LIST (APPENDIX 1)" filled={0} total={0} badge="0 rows" cueColor="blue" index={7}>
              <div className="rack-empty">
                <span>Chưa có cửa hàng nào. Paste từ Excel hoặc thêm thủ công.</span>
                <button className="rack-add-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>THÊM CỬA HÀNG</button>
              </div>
            </Rack>

            <Rack id="fees" title="FEE TABLE (APPENDIX 2)" filled={0} total={0} badge="computed" cueColor="indigo" index={8}>
              <div className="rack-empty"><span>Bảng phí sẽ được tính tự động từ Service Pricing và Store List.</span></div>
            </Rack>
          </div>
        </div>

        <div className="split-handle"><div className="split-handle-bar" /></div>

        <div className="preview-pane">
          <div className="preview-tabs">
            {(['main','app1','app2'] as const).map(t => (
              <button key={t} className={`preview-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'main' ? 'Main Contract' : t === 'app1' ? 'Appendix 1' : 'Appendix 2'}
              </button>
            ))}
          </div>
          <div className="preview-frame">
            <div className="preview-placeholder">
              <div className="preview-doc-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </div>
              <span className="preview-placeholder-text">Live preview sẽ hiển thị khi bạn điền form</span>
              <span className="preview-placeholder-hint">Skeleton HTML · mammoth.js</span>
            </div>
          </div>
        </div>
      </div>

      <StatusBar completeness={completeness} filledCount={filledCount} totalFields={totalFields} draftTitle={formData['meta.contractNo'] || 'Untitled'} />
    </div>
  )
}
