interface NavigationProps {
  activeTab: 'timeline' | 'editor' | 'settings';
  onTabChange: (tab: 'timeline' | 'editor' | 'settings') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'editor', label: 'Editor' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
