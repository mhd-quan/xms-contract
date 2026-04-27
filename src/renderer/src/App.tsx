import { useEffect } from 'react'
import LibraryView from './views/LibraryView'
import FormView from './views/FormView'
import SettingsModal from './components/SettingsModal'
import { useAppStore } from './stores/app-store'

export default function App() {
  const view = useAppStore((state) => state.view)
  const showSettings = useAppStore((state) => state.showSettings)
  const navigateToForm = useAppStore((state) => state.navigateToForm)
  const navigateToLibrary = useAppStore((state) => state.navigateToLibrary)
  const openSettings = useAppStore((state) => state.openSettings)
  const closeSettings = useAppStore((state) => state.closeSettings)
  const toggleSettings = useAppStore((state) => state.toggleSettings)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === ',') {
        e.preventDefault()
        toggleSettings()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSettings])

  return (
    <div className="app-shell">
      {view.type === 'library' && (
        <div className="view-enter" key="library">
          <LibraryView
            onOpenTemplate={navigateToForm}
            onOpenSettings={openSettings}
          />
        </div>
      )}
      {view.type === 'form' && (
        <div className="view-enter" key={`form-${view.draftId}`}>
          <FormView
            draftId={view.draftId}
            templateId={view.templateId}
            onBack={navigateToLibrary}
            onOpenSettings={openSettings}
          />
        </div>
      )}
      {showSettings && <SettingsModal onClose={closeSettings} />}
    </div>
  )
}
