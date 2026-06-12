import { useState } from 'react';
import { generateResolution } from '../../lib/tauri';
import { useResolutionStore } from '../../stores/resolutionStore';

interface GenerateButtonProps {
  templateId: string;
  disabled?: boolean;
}

export function GenerateButton({ templateId, disabled }: GenerateButtonProps) {
  const {
    selectedActivityIds,
    startGeneration,
    setCurrentResolutionId,
    finishGeneration,
  } = useResolutionStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (disabled || selectedActivityIds.length === 0) return;

    setIsLoading(true);
    startGeneration(null);
    try {
      const resolutionId = await generateResolution(selectedActivityIds, templateId);
      setCurrentResolutionId(resolutionId);
    } catch (error) {
      console.error('Failed to start generation:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      finishGeneration(false, errorMessage);
      alert(`Failed to start generation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={disabled || isLoading}
      className="w-full px-4 py-3 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? 'Starting...' : 'Generate Draft'}
    </button>
  );
}
