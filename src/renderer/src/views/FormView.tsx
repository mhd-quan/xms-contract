import { useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Rack from '../components/Rack'
import StatusBar from '../components/StatusBar'
import PreviewPane from '../components/PreviewPane'
import { coerceDocumentKind } from '@shared/schema/document-kind'

interface Props {
  draftId: string
  templateId: string
  onBack: () => void
  onOpenSettings: () => void
}

const EDITABLE_FIELD_KEYS = [
  'meta.contractNo',
  'meta.signedDate',
  'partyB.name',
  'partyB.address',
  'partyB.taxCode',
  'partyB.phone',
  'partyB.representative',
  'partyB.position',
  'partyB.bankAccount',
  'partyB.bankName',
  'partyB.bankBranch',
  'term.startDate',
  'term.endDate',
  'pricing.relatedRights.year',
  'pricing.relatedRights.month',
  'pricing.composition.year',
  'pricing.composition.month',
  'pricing.account.year',
  'pricing.account.month',
  'pricing.app.year',
  'pricing.web.year',
  'pricing.device.year',
  'invoice.company',
  'invoice.address',
  'invoice.taxCode',
  'contact.a.name',
  'contact.a.email',
  'contact.a.phone',
  'contact.b.name',
  'contact.b.email',
  'contact.b.phone'
] as const

interface StoreRow {
  id: string
  name: string
  address: string
  usingTerm: string
  months: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeFormData(data: unknown): Record<string, string> {
  if (!isRecord(data)) return {}
  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') acc[key] = value
    if (typeof value === 'number' || typeof value === 'boolean') acc[key] = String(value)
    return acc
  }, {})
}

function normalizeStores(data: unknown): StoreRow[] {
  if (!isRecord(data) || !Array.isArray(data.stores)) return []
  return data.stores
    .filter(isRecord)
    .map((row) => ({
      id: typeof row.id === 'string' ? row.id : uuidv4(),
      name: typeof row.name === 'string' ? row.name : '',
      address: typeof row.address === 'string' ? row.address : '',
      usingTerm: typeof row.usingTerm === 'string' ? row.usingTerm : '',
      months: typeof row.months === 'string' || typeof row.months === 'number' ? String(row.months) : ''
    }))
}

function deriveDraftTitle(data: Record<string, string>): string {
  const contractNo = data['meta.contractNo']?.trim()
  const partyName = data['partyB.name']?.trim()
  if (contractNo && partyName) return `${contractNo} · ${partyName}`
  if (contractNo) return contractNo
  if (partyName) return partyName
  return 'Untitled'
}

export default function FormView({ draftId, templateId, onBack, onOpenSettings }: Props) {
  const draftKind = coerceDocumentKind(templateId)
  const [activeTab, setActiveTab] = useState<'main' | 'app1' | 'app2'>('main')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [stores, setStores] = useState<StoreRow[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportedPath, setExportedPath] = useState<string | null>(null)
  const draftMetaRef = useRef<{ createdAt: string | null; exportedPath: string | null }>({
    createdAt: null,
    exportedPath: null
  })
  const hydratedRef = useRef(false)
  const dirtyRef = useRef(false)

  const totalFields = 45
  const filledCount = useMemo(
    () => EDITABLE_FIELD_KEYS.filter((key) => formData[key]?.trim()).length,
    [formData]
  )
  const completeness = Math.round((filledCount / totalFields) * 100)
  const draftTitle = useMemo(() => deriveDraftTitle(formData), [formData])

  useEffect(() => {
    let alive = true
    hydratedRef.current = false
    dirtyRef.current = false
    draftMetaRef.current = { createdAt: null, exportedPath: null }

    window.api.loadDraft(draftId)
      .then((draft) => {
        if (!alive) return
        draftMetaRef.current = {
          createdAt: draft?.createdAt ?? null,
          exportedPath: draft?.exportedPath ?? null
        }
        setExportedPath(draft?.exportedPath ?? null)
        setFormData(normalizeFormData(draft?.data))
        setStores(normalizeStores(draft?.data))
        hydratedRef.current = true
      })
      .catch(() => {
        if (!alive) return
        setFormData({})
        setStores([])
        hydratedRef.current = true
      })

    return () => {
      alive = false
    }
  }, [draftId])

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return

    const handle = window.setTimeout(() => {
      const now = new Date().toISOString()
      window.api.saveDraft({
        id: draftId,
        kind: draftKind,
        templateId,
        title: draftTitle,
        createdAt: draftMetaRef.current.createdAt ?? now,
        updatedAt: now,
        exportedPath: draftMetaRef.current.exportedPath,
        data: { ...formData, stores }
      }).then((result) => {
        draftMetaRef.current.createdAt ??= now
        if (result?.savedAt) dirtyRef.current = false
      }).catch(() => {
        /* keep dirty state so the next edit retries */
      })
    }, 1200)

    return () => window.clearTimeout(handle)
  }, [draftId, draftKind, draftTitle, formData, stores, templateId])

  function updateField(key: string, value: string) {
    dirtyRef.current = true
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function addStoreRow() {
    dirtyRef.current = true
    setStores((prev) => [...prev, { id: uuidv4(), name: '', address: '', usingTerm: '', months: '' }])
  }

  function updateStoreRow(id: string, key: keyof Omit<StoreRow, 'id'>, value: string) {
    dirtyRef.current = true
    setStores((prev) => prev.map((row) => row.id === id ? { ...row, [key]: value } : row))
  }

  function deleteStoreRow(id: string) {
    dirtyRef.current = true
    setStores((prev) => prev.filter((row) => row.id !== id))
  }

  function suggestedExportName() {
    return `${draftTitle === 'Untitled' ? 'xms-contract' : draftTitle}`.replace(/[/:*?"<>|]/g, '-').slice(0, 80) + '.docx'
  }

  async function persistDraft(nextExportedPath = draftMetaRef.current.exportedPath) {
    const now = new Date().toISOString()
    await window.api.saveDraft({
      id: draftId,
      kind: draftKind,
      templateId,
      title: draftTitle,
      createdAt: draftMetaRef.current.createdAt ?? now,
      updatedAt: now,
      exportedPath: nextExportedPath,
      data: { ...formData, stores }
    })
    draftMetaRef.current.createdAt ??= now
    dirtyRef.current = false
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      await persistDraft()
      const rendered = await window.api.renderDocx({
        draftId,
        kind: draftKind,
        templateId,
        data: { ...formData, stores }
      })
      const saved = await window.api.saveAs(rendered.tempPath, suggestedExportName())
      if ('finalPath' in saved) {
        draftMetaRef.current.exportedPath = saved.finalPath
        setExportedPath(saved.finalPath)
        await persistDraft(saved.finalPath)
      }
    } finally {
      setIsExporting(false)
    }
  }

  function handleOpenExport() {
    if (exportedPath) window.api.openFile(exportedPath)
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
            <Rack id="meta" title="CONTRACT METADATA" filled={['meta.contractNo','meta.signedDate'].filter(k => formData[k]).length} total={2} defaultOpen cueColor="picton" index={0}>
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

            <Rack id="stores" title="STORE LIST (APPENDIX 1)" filled={stores.length} total={0} badge={`${stores.length} rows`} cueColor="blue" index={7}>
              <div className="clip-table">
                <div className="clip-table-toolbar">
                  <span className="clip-table-meta">Appendix 1 · Store clip slots</span>
                  <button className="rack-add-btn" type="button" onClick={addStoreRow}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>THÊM CỬA HÀNG
                  </button>
                </div>
                <div className="clip-grid">
                  <div className="clip-row clip-head">
                    <span />
                    <span>Tên cửa hàng</span>
                    <span>Địa chỉ</span>
                    <span>Thời hạn</span>
                    <span>Tháng</span>
                    <span />
                  </div>
                  {stores.length === 0 ? (
                    <div className="clip-empty">Chưa có cửa hàng nào. Dùng nút thêm hoặc paste từ Excel ở bước tiếp theo.</div>
                  ) : stores.map((store, index) => (
                    <div className="clip-row" key={store.id}>
                      <span className="clip-launch">{index + 1}</span>
                      <input className="clip-cell" value={store.name} onChange={(e) => updateStoreRow(store.id, 'name', e.target.value)} placeholder="Store name" />
                      <input className="clip-cell" value={store.address} onChange={(e) => updateStoreRow(store.id, 'address', e.target.value)} placeholder="Address" />
                      <input className="clip-cell" value={store.usingTerm} onChange={(e) => updateStoreRow(store.id, 'usingTerm', e.target.value)} placeholder="01/05/2026 - 30/04/2027" />
                      <input className="clip-cell tnum" inputMode="numeric" value={store.months} onChange={(e) => updateStoreRow(store.id, 'months', e.target.value)} placeholder="12" />
                      <button className="clip-delete" type="button" onClick={() => deleteStoreRow(store.id)} title="Delete row">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Rack>

            <Rack id="fees" title="FEE TABLE (APPENDIX 2)" filled={0} total={0} badge="computed" cueColor="indigo" index={8}>
              <div className="rack-empty"><span>Bảng phí sẽ được tính tự động từ Service Pricing và Store List.</span></div>
            </Rack>
          </div>
        </div>

        <div className="split-handle"><div className="split-handle-bar" /></div>

        <PreviewPane activeTab={activeTab} onTabChange={setActiveTab} formData={formData} stores={stores} />
      </div>

      <StatusBar
        completeness={completeness}
        filledCount={filledCount}
        totalFields={totalFields}
        draftTitle={draftTitle}
        exportAvailable
        exportedPath={exportedPath}
        isExporting={isExporting}
        onExport={handleExport}
        onOpenExport={handleOpenExport}
      />
    </div>
  )
}
