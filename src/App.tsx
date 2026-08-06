import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { JsonCompareScreen } from './components/JsonCompareScreen'

type Screen = 'dashboard' | 'compare'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {currentScreen === 'dashboard' && (
        <Dashboard onSelectCompare={() => setCurrentScreen('compare')} />
      )}
      {currentScreen === 'compare' && (
        <JsonCompareScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
    </div>
  )
}
