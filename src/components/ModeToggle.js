// components/ModeToggle.js
import React from 'react';

const ModeToggle = ({ mode, setMode }) => {
  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-full shadow px-2 py-1 flex gap-2">
      <button
        onClick={() => setMode('hot')}
        className={`px-4 py-1 rounded-full text-sm ${mode === 'hot' ? 'bg-black text-white' : 'bg-gray-200'}`}
      >
        🔥 Hot Bars
      </button>
      <button
        onClick={() => setMode('match')}
        className={`px-4 py-1 rounded-full text-sm ${mode === 'match' ? 'bg-black text-white' : 'bg-gray-200'}`}
      >
        🎯 Match Bars
      </button>
    </div>
  );
};

export default ModeToggle;
