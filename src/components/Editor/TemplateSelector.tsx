interface TemplateSelectorProps {
  selected: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
}

const TEMPLATES = [
  { id: 'incident', name: 'Incident Resolution', description: 'For incident tickets' },
  { id: 'request', name: 'Service Request', description: 'For service requests' },
  { id: 'change', name: 'Change Record', description: 'For change tickets' },
  { id: 'problem', name: 'Problem Investigation', description: 'For problem tickets' },
  { id: 'generic', name: 'Generic', description: 'General purpose template' },
];

export function TemplateSelector({ selected, onChange, disabled }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Template
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} — {template.description}
          </option>
        ))}
      </select>
    </div>
  );
}
