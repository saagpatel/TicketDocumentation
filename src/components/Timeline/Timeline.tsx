import { useActivityStore } from '../../stores/activityStore';
import { ActivityCard } from './ActivityCard';

export function Timeline() {
  const { activities, selectedIds, toggleSelection, clearSelection } = useActivityStore();

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with selection controls */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-400">
            {selectedIds.length} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p>No activities yet</p>
            <p className="text-sm mt-1">Start monitoring to see activities here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isSelected={selectedIds.includes(activity.id)}
                onToggleSelect={toggleSelection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
