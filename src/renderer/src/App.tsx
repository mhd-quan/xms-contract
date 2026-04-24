import { useState, useEffect, useCallback } from 'react'
import LibraryView from './views/LibraryView'
import FormView from './views/FormView'
import SettingsModal from './components/SettingsModal'
import type { AppView } from '@shared/types'

export default function App() {
  const [view, setView] = useState<AppView>({ type: 'library' })
  const [showSettings, setShowSettings] = useState(false)

  const navigateToForm = useCallback((draftId: string, templateId: string) => {
    setView({ type: 'form', draftId, templateId })
  }, [])

  const navigateToLibrary = useCallback(() => {
    setView({ type: 'library' })
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === ',') {
        e.preventDefault()
        setShowSettings((s) => !s)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-shell">
      {view.type === 'library' && (
        <LibraryView
          onOpenTemplate={navigateToForm}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {view.type === 'form' && (
        <FormView
          draftId={view.draftId}
          templateId={view.templateId}
          onBack={navigateToLibrary}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
