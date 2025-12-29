'use client';

const PLAYER_COLORS = [
  { id: 'red', name: 'Red', bg: 'bg-red-600', border: 'border-red-500' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-600', border: 'border-blue-500' },
  { id: 'green', name: 'Green', bg: 'bg-green-600', border: 'border-green-500' },
  { id: 'yellow', name: 'Yellow', bg: 'bg-yellow-500', border: 'border-yellow-400' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-600', border: 'border-purple-500' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-500', border: 'border-orange-400' },
  { id: 'pink', name: 'Pink', bg: 'bg-pink-500', border: 'border-pink-400' },
  { id: 'black', name: 'Black', bg: 'bg-gray-800', border: 'border-gray-600' },
];

interface ColorSelectProps {
  selectedColor?: string;
  takenColors: string[];
  onSelect: (color: string) => void;
  disabled?: boolean;
}

export default function ColorSelect({
  selectedColor,
  takenColors,
  onSelect,
  disabled = false,
}: ColorSelectProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PLAYER_COLORS.map((color) => {
        const isTaken = takenColors.includes(color.id);
        const isSelected = selectedColor === color.id;

        return (
          <button
            key={color.id}
            type="button"
            onClick={() => !isTaken && !disabled && onSelect(color.id)}
            disabled={isTaken || disabled}
            className={`relative w-full aspect-square rounded-lg border-2 transition-all ${color.bg} ${
              isSelected
                ? `${color.border} ring-2 ring-white ring-offset-2 ring-offset-gray-800`
                : 'border-transparent'
            } ${
              isTaken || disabled
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:opacity-80 cursor-pointer'
            }`}
            title={isTaken ? `${color.name} is taken` : color.name}
          >
            {isTaken && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
            {isSelected && !isTaken && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
