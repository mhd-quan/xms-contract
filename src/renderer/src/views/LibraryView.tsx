import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { coerceDocumentKind, type DocumentKind } from '@shared/schema/document-kind'

interface Props {
  onOpenTemplate: (draftId: string, templateId: string) => void
  onOpenSettings: () => void
}

interface DraftSummary {
  id: string
  kind?: DocumentKind
  templateId: string
  title: string
  createdAt: string
  updatedAt: string
}

interface TemplateEntry {
  id: string
  kind?: DocumentKind
  name: string
  subtitle: string
  version: string
}

export default function LibraryView({ onOpenTemplate, onOpenSettings }: Props) {
  const [templates, setTemplates] = useState<TemplateEntry[]>([])
  const [drafts, setDrafts] = useState<DraftSummary[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const tpls = await window.api.listTemplates()
      setTemplates(tpls?.length ? tpls : [
        { id: 'contract-fullright', kind: 'contract-fullright', name: 'Contract Fullright', subtitle: 'Background Music Service Agreement', version: '1.0.0' }
      ])
      const draftList = await window.api.listDrafts()
      setDrafts(draftList || [])
    } catch {
      setTemplates([
        { id: 'contract-fullright', kind: 'contract-fullright', name: 'Contract Fullright', subtitle: 'Background Music Service Agreement', version: '1.0.0' }
      ])
    }
  }

  async function handleNewDraft(templateId: string) {
    const draftId = uuidv4()
    const now = new Date().toISOString()
    const kind = coerceDocumentKind(templateId)
    try {
      await window.api.saveDraft({ id: draftId, kind, templateId: kind, title: 'Untitled', createdAt: now, updatedAt: now, exportedPath: null, data: {} })
    } catch { /* proceed */ }
    onOpenTemplate(draftId, kind)
  }

  async function handleDeleteDraft(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    try { await window.api.deleteDraft(id); setDrafts((d) => d.filter((x) => x.id !== id)) } catch {}
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'vừa xong'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="library-shell">
      <header className="library-topbar">
        <div className="library-brand">
          <svg className="library-brand-mark" width="32" height="32" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill="#000" />
            <defs><linearGradient id="libG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#CFF533" /><stop offset="100%" stopColor="#44CCFF" /></linearGradient></defs>
            <ellipse cx="26" cy="50" rx="3.2" ry="13" fill="#BBF0FF" opacity=".9" />
            <ellipse cx="38" cy="50" rx="3.2" ry="25" fill="url(#libG)" />
            <ellipse cx="50" cy="50" rx="3.2" ry="9" fill="#BBF0FF" opacity=".9" />
            <ellipse cx="62" cy="50" rx="3.2" ry="25" fill="url(#libG)" />
            <ellipse cx="74" cy="50" rx="3.2" ry="13" fill="#BBF0FF" opacity=".9" />
          </svg>
          <div className="library-brand-text">
            <span className="library-brand-name">XMS CONTRACT</span>
            <span className="library-brand-version">v0.1.0</span>
          </div>
        </div>
        <button className="lib-settings-btn" onClick={onOpenSettings} title="Cài đặt (⌘,)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15 1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9c.27.68.87 1.15 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      <div className="library-content">
        <div className="library-chips">
          <button className="lib-chip active"><span className="chip-dot" />ALL</button>
          <button className="lib-chip">CONTRACTS</button>
          <button className="lib-chip disabled" disabled>APPENDICES</button>
          <button className="lib-chip disabled" disabled>INVOICES</button>
        </div>

        <section className="library-section">
          <div className="lib-section-head">
            <span className="lib-section-label">Templates</span>
            <span className="lib-section-count">{templates.length}</span>
          </div>
          <div className="template-grid">
            {templates.map((tpl) => (
              <button key={tpl.id} className={`template-card${hoveredCard === tpl.id ? ' hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(tpl.id)} onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleNewDraft(tpl.id)}>
                <div className="tpl-thumb">
                  <div className="tpl-thumb-lines">{[80,60,90,40,70,55,85,45].map((w,i) => <div key={i} className="tpl-line" style={{width:`${w}%`}} />)}</div>
                  <div className="tpl-thumb-overlay" />
                </div>
                <div className="tpl-body">
                  <div className="tpl-meta"><span className="tpl-title">{tpl.name}</span><span className="tpl-subtitle">{tpl.subtitle}</span></div>
                  <div className="tpl-action">
                    <span className="tpl-version">v{tpl.version}</span>
                    <span className="tpl-new-btn"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>NEW</span>
                  </div>
                </div>
                <div className="tpl-led" />
              </button>
            ))}
            <div className="template-card-placeholder">
              <div className="placeholder-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><path d="M12 5v14M5 12h14" /></svg>
                <span>More templates coming</span>
              </div>
            </div>
          </div>
        </section>

        {drafts.length > 0 && (
          <section className="library-section">
            <div className="lib-section-head"><span className="lib-section-label">Recent Drafts</span><span className="lib-section-count">{drafts.length}</span></div>
            <div className="drafts-strip">
              {drafts.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((d) => (
                <button key={d.id} className="draft-chip" onClick={() => onOpenTemplate(d.id, d.templateId)}>
                  <span className="draft-dot" /><div className="draft-chip-info"><span className="draft-chip-title">{d.title}</span><span className="draft-chip-time">{timeAgo(d.updatedAt)}</span></div>
                  <button className="draft-chip-delete" onClick={(e) => handleDeleteDraft(e, d.id)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="library-footer"><span className="signal-dot" /><span>XMusic Station · Contract Generator</span></div>
      </div>
    </div>
  )
}
