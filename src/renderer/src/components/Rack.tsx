import { useState, type ReactNode } from 'react'

const CUE_MAP: Record<string, { cue: string; dim: string; glow: string }> = {
  picton:       { cue: 'var(--picton)',      dim: 'var(--picton-dim)',      glow: 'rgba(68,204,255,0.25)' },
  rose:         { cue: 'var(--cue-rose)',    dim: 'var(--cue-rose-dim)',    glow: 'var(--cue-rose-glow)' },
  gold:         { cue: 'var(--cue-gold)',    dim: 'var(--cue-gold-dim)',    glow: 'var(--cue-gold-glow)' },
  green:        { cue: 'var(--cue-green)',   dim: 'var(--cue-green-dim)',   glow: 'var(--cue-green-glow)' },
  'daw-orange': { cue: 'var(--daw-orange)',  dim: 'var(--daw-orange-dim)',  glow: 'var(--daw-orange-glow)' },
  violet:       { cue: 'var(--cue-violet)',  dim: 'var(--cue-violet-dim)', glow: 'var(--cue-violet-glow)' },
  teal:         { cue: 'var(--cue-teal)',    dim: 'var(--cue-teal-dim)',    glow: 'var(--cue-teal-glow)' },
  blue:         { cue: 'var(--cue-blue)',    dim: 'var(--cue-blue-dim)',    glow: 'var(--cue-blue-glow)' },
  indigo:       { cue: 'var(--cue-indigo)',  dim: 'var(--cue-indigo-dim)', glow: 'var(--cue-indigo-glow)' },
}

interface Props {
  id: string
  title: string
  filled: number
  total: number
  defaultOpen?: boolean
  badge?: string
  cueColor?: string
  index?: number
  children: ReactNode
}

export default function Rack({ id, title, filled, total, defaultOpen = false, badge, cueColor, index = 0, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const ledStatus = total === 0 ? 'neutral' : filled === total ? 'complete' : filled > 0 ? 'partial' : 'empty'

  const cue = cueColor ? CUE_MAP[cueColor] : undefined
  const rackStyle = {
    ...(cue ? {
      '--rack-cue': cue.cue,
      '--rack-cue-dim': cue.dim,
      '--rack-cue-glow': cue.glow,
    } : {}),
    animationDelay: `${index * 40}ms`,
  } as React.CSSProperties

  return (
    <div className={`rack${open ? ' rack-open' : ''}`} id={`rack-${id}`} style={rackStyle}>
      <button className="rack-header" onClick={() => setOpen(!open)}>
        <span className={`rack-triangle${open ? ' rack-triangle-open' : ''}`}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M2 1l4 3-4 3z"/>
          </svg>
        </span>
        <span className={`rack-led rack-led-${ledStatus}`} />
        <span className="rack-title">{title}</span>
        <span className="rack-spacer" />
        {badge ? (
          <span className="rack-badge">{badge}</span>
        ) : total > 0 ? (
          <span className="rack-counter">{filled}/{total} fields</span>
        ) : null}
      </button>
      <div className={`rack-body${open ? ' rack-body-open' : ''}`}>
        <div className="rack-content">{children}</div>
      </div>
    </div>
  )
}
