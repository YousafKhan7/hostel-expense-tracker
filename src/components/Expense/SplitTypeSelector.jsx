export default function SplitTypeSelector({ value, onChange }) {
  const splitTypes = [
    { id: 'equal', name: 'Equal', description: 'Split equally between selected members' },
    { id: 'custom', name: 'Custom', description: 'Specify individual amounts' }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Split Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        {splitTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`
              cursor-pointer rounded-lg border p-3 text-left
              ${value === type.id
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  value === type.id ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  {type.name}
                </p>
                <p className={`text-xs ${
                  value === type.id ? 'text-primary-700' : 'text-gray-500'
                }`}>
                  {type.description}
                </p>
              </div>
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                value === type.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {value === type.id && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 