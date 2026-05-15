'use client';

import React from 'react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export function Numpad({ onKeyPress, onDelete }: NumpadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto mt-8">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          className="h-20 text-3xl font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-2xl transition-colors text-gray-800 flex items-center justify-center select-none"
        >
          {key}
        </button>
      ))}
      <button
        onClick={onDelete}
        className="h-20 text-2xl font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-2xl transition-colors text-gray-800 flex items-center justify-center select-none"
        aria-label="Delete"
      >
        <Delete size={32} />
      </button>
    </div>
  );
}
