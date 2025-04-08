// src/TestSeed.js
import React from 'react';
import { seedTestCheckins } from './seedTestCheckins';

const TestSeed = () => {
  const handleSeed = async () => {
    try {
      await seedTestCheckins();
      alert('✅ Dummy check-ins added!');
    } catch (err) {
      console.error('Seeding failed:', err);
      alert('❌ Failed to seed check-ins');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Seed Dummy Check-Ins</h1>
      <button
        onClick={handleSeed}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded shadow"
      >
        Seed Check-Ins
      </button>
    </div>
  );
};

export default TestSeed;
