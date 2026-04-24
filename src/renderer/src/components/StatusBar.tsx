interface Props {
  completeness: number
  filledCount: number
  totalFields: number
  draftTitle: string
}

export default function StatusBar({ completeness, filledCount, totalFields, draftTitle }: Props) {
  const isReady = completeness >= 100

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className={`statusbar-dot${filledCount > 0 ? ' active' : ''}`} />
        <span className="statusbar-draft">draft · {draftTitle}</span>
      </div>
      <div className="statusbar-center">
        <span className="statusbar-progress">{filledCount}/{totalFields} fields</span>
        <span className="statusbar-sep">·</span>
        <span className="statusbar-pct">{completeness}%</span>
        <div className="statusbar-vu">
          <div className="statusbar-vu-fill" style={{ width: `${completeness}%` }} />
        </div>
      </div>
      <div className="statusbar-right">
        <button className="statusbar-btn" disabled>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          OPEN IN WORD
        </button>
        <button className={`statusbar-btn export-action${isReady ? ' ready' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>
          EXPORT DOCX
        </button>
      </div>
    </div>
  )
}
