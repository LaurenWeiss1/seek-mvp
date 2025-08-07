// src/FilterPanel.js
import React from 'react';

const FilterPanel = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters({});

  return (
    <div className="bg-white text-black p-4 rounded shadow mb-6">
      <h3 className="text-lg font-bold mb-3">Filter your crowd 🔍</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={filters.age || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="gender"
          placeholder="Gender"
          value={filters.gender || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="sexuality"
          placeholder="Sexuality"
          value={filters.sexuality || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="hometown"
          placeholder="Hometown"
          value={filters.hometown || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="college"
          placeholder="College"
          value={filters.college || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="industry"
          placeholder="Industry"
          value={filters.industry || ''}
          onChange={handleChange}
          className="p-2 border rounded"
        />
      </div>
      <button
        onClick={clearFilters}
        className="mt-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;
 