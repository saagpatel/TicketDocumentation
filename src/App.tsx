import { useState, useEffect } from 'react';
import { Navigation } from './components/common/Navigation';
import { StatusBar } from './components/common/StatusBar';
import { ToastContainer } from './components/common/ToastContainer';
import { Onboarding } from './components/common/Onboarding';
import { Timeline } from './components/Timeline/Timeline';
import { Editor } from './components/Editor/Editor';
import { Settings } from './components/Settings/Settings';
import { useActivityStream } from './hooks/useActivityStream';
import { useMonitoringStatus } from './hooks/useMonitoringStatus';
import { useEscapeKey } from './hooks/useEscapeKey';
import { getMonitoringStatus } from './lib/tauri';
import './styles/global.css';

function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'editor' | 'settings'>('timeline');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const status = await getMonitoringStatus();
        // Show onboarding if no permission and not monitoring
        const needsOnboarding = !status.has_screen_recording_permission || !status.is_running;
        setShowOnboarding(needsOnboarding);
      } catch {
        setShowOnboarding(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkFirstLaunch();
  }, []);

  // Set up event listeners
  useActivityStream();
  useMonitoringStatus();
  useEscapeKey();

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {showOnboarding && <Onboarding />}

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'timeline' && <Timeline />}
      {activeTab === 'editor' && <Editor />}
      {activeTab === 'settings' && <Settings />}

      <StatusBar />
      <ToastContainer />
    </div>
  );
}

export default App;
