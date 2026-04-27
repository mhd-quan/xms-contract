import { useEffect } from 'react'
import StatusBar from '../../../components/StatusBar'
import { useDraftStore } from '../../../stores/draft-store'
import type { DocumentKind } from '@shared/schema/document-kind'

interface Props {
  draftId: string
  templateId: string
  documentKind: DocumentKind
  onBack: () => void
  onOpenSettings: () => void
}

export default function AnnexNewstoreFormView({ draftId, templateId, documentKind, onBack, onOpenSettings }: Props) {
  const loadDraft = useDraftStore((state) => state.loadDraft)
  const resetDraft = useDraftStore((state) => state.reset)

  useEffect(() => {
    loadDraft(draftId, documentKind)
    return () => resetDraft()
  }, [documentKind, draftId, loadDraft, resetDraft])

  return (
    <div className="form-shell">
      <header className="form-topbar">
        <div className="form-topbar-left">
          <button className="form-back-btn" onClick={onBack} title="Back to Library">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <div className="form-breadcrumb">
            <span className="bc-dim">XMS</span><span className="bc-sep">/</span>
            <span className="bc-active">{templateId}</span>
            <span className="bc-sep">›</span>
            <span className="bc-active">Draft: {draftId.slice(0, 8)}</span>
          </div>
        </div>
        <div className="form-topbar-right">
          <button className="lib-settings-btn" onClick={onOpenSettings}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 22.61 7.1l-.06.06A1.65 1.65 0 0 0 22.22 9c.27.68.87 1.15 1.51 1H24a2 2 0 0 1 0 4h-.27a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      <div className="form-split">
        <div className="form-pane">
          <div className="form-scroll">
            <div className="rack-empty">
              <span>Annex New Store schema is ready; form fields will be added when the annex spec is provided.</span>
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        completeness={0}
        filledCount={0}
        totalFields={0}
        draftTitle="Annex New Store"
        exportAvailable={false}
        exportedPath={null}
        isExporting={false}
        onExport={() => {}}
        onOpenExport={() => {}}
      />
    </div>
  )
}
