import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { JsonCompareScreen } from './components/JsonCompareScreen'
import { LogAnalyzerScreen } from './components/LogAnalyzerScreen'

type Screen = 'dashboard' | 'compare' | 'logAnalyzer'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {currentScreen === 'dashboard' && (
        <Dashboard 
          onSelectCompare={() => setCurrentScreen('compare')} 
          onSelectLogAnalyzer={() => setCurrentScreen('logAnalyzer')}
        />
      )}
      {currentScreen === 'compare' && (
        <JsonCompareScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
      {currentScreen === 'logAnalyzer' && (
        <LogAnalyzerScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
    </div>
  )
}
