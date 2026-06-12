import { useSettingsStore } from '../../stores/settingsStore';
import { useActivityStore } from '../../stores/activityStore';
import { PauseButton } from './PauseButton';

export function StatusBar() {
  const isMonitoring = useSettingsStore((state) => state.isMonitoring);
  const activityCount = useActivityStore((state) => state.activities.length);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-gray-600 dark:text-gray-400">
              {isMonitoring ? 'Monitoring' : 'Not monitoring'}
            </span>
          </span>
          <span className="text-gray-500 dark:text-gray-500">
            {activityCount} activities
          </span>
        </div>
        <PauseButton />
      </div>
    </div>
  );
}
