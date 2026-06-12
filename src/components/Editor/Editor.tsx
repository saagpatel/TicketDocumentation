import { useState, useEffect } from 'react';
import { useResolutionStore } from '../../stores/resolutionStore';
import { useActivityStore } from '../../stores/activityStore';
import { useLlmStream } from '../../hooks/useLlmStream';
import { TemplateSelector } from './TemplateSelector';
import { GenerateButton } from './GenerateButton';
import { DraftPreview } from './DraftPreview';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export function Editor() {
  const {
    currentDraft,
    isGenerating,
    generationError,
    selectedActivityIds,
    setCurrentDraft,
    clearDraft,
    setSelectedActivityIds,
  } = useResolutionStore();

  const { selectedIds } = useActivityStore();

  const [selectedTemplate, setSelectedTemplate] = useState('incident');
  const [copySuccess, setCopySuccess] = useState(false);

  // Subscribe to LLM streaming events
  useLlmStream();

  // Sync selected activity IDs from activity store
  useEffect(() => {
    setSelectedActivityIds(selectedIds);
  }, [selectedIds, setSelectedActivityIds]);

  const handleCopyToClipboard = async () => {
    try {
      await writeText(currentDraft);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleClear = () => {
    clearDraft();
    setCopySuccess(false);
  };

  const hasSelection = selectedActivityIds.length > 0;
  const hasDraft = currentDraft.length > 0;

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Resolution Draft</h2>
        {hasDraft && !isGenerating && (
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}
      </div>

      {/* Template Selector */}
      <TemplateSelector
        selected={selectedTemplate}
        onChange={setSelectedTemplate}
        disabled={isGenerating}
      />

      {/* Draft Preview or Empty State */}
      {hasDraft || isGenerating ? (
        <DraftPreview
          draft={currentDraft}
          isGenerating={isGenerating}
          onEdit={setCurrentDraft}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="mb-2">No draft yet</p>
            <p className="text-sm">
              Select activities from the timeline and click Generate
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {generationError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
          <strong>Generation failed:</strong> {generationError}
        </div>
      )}

      {/* Generate Button */}
      <GenerateButton
        templateId={selectedTemplate}
        disabled={!hasSelection || isGenerating}
      />

      {/* Status Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {selectedActivityIds.length > 0 && (
          <p>{selectedActivityIds.length} activities selected</p>
        )}
      </div>
    </div>
  );
}
