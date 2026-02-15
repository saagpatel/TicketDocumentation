import type { Activity } from '../../lib/types';

interface ActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}

export function ActivityCard({ activity, isSelected, onToggleSelect }: ActivityCardProps) {
  const handleClick = () => {
    onToggleSelect(activity.id);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'ongoing';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'incident':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'service_request':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'change':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'problem':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'how_to':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'app_installation':
      case 'app_installer_file':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatCategory = (category: string | null) => {
    if (!category) return null;
    return category.replace(/_/g, ' ');
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white dark:bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {activity.app_name}
            </div>
            {activity.detected_category && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                  activity.detected_category
                )}`}
              >
                {formatCategory(activity.detected_category)}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
            {activity.window_title || '(no title)'}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span>{new Date(activity.started_at).toLocaleTimeString()}</span>
            <span>•</span>
            <span>{formatDuration(activity.duration_seconds)}</span>
          </div>
        </div>
        <div className="ml-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );
}
