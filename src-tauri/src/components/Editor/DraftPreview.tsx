interface DraftPreviewProps {
  draft: string;
  isGenerating: boolean;
  onEdit: (text: string) => void;
}

export function DraftPreview({ draft, isGenerating, onEdit }: DraftPreviewProps) {
  return (
    <div className="flex-1 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isGenerating ? 'Generating...' : 'Draft'}
        </label>
        {isGenerating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Streaming from LLM...
            </span>
          </div>
        )}
      </div>
      <textarea
        value={draft}
        onChange={(e) => onEdit(e.target.value)}
        readOnly={isGenerating}
        placeholder={isGenerating ? 'Waiting for first token...' : 'Generated draft will appear here'}
        className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        style={{ minHeight: '200px' }}
      />
      {!isGenerating && draft.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {draft.length} characters • Edit before copying
        </p>
      )}
    </div>
  );
}
