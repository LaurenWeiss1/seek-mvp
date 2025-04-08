// components/FilterDrawer.js
import React from 'react';

const FilterDrawer = ({ filters, setFilters }) => {
  const update = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  return (
    <div className="absolute top-14 left-0 w-full bg-white z-10 p-4 shadow-md rounded-b-xl">
      <div className="flex flex-col gap-2">
        <label>
          Gender:
          <select value={filters.gender} onChange={e => update('gender', e.target.value)}>
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="nonbinary">Nonbinary</option>
          </select>
        </label>
        <label>
          Orientation:
          <select value={filters.orientation} onChange={e => update('orientation', e.target.value)}>
            <option value="all">All</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="bi">Bi</option>
            <option value="queer">Queer</option>
          </select>
        </label>
        <label>
          College:
          <input type="text" value={filters.college} onChange={e => update('college', e.target.value)} placeholder="All or name..." />
        </label>
        <label>
          Age Range:
          <input type="range" min="18" max="100" value={filters.ageRange[1]} onChange={e => update('ageRange', [18, +e.target.value])} />
          <div>18 to {filters.ageRange[1]}</div>
        </label>
      </div>
    </div>
  );
};

export default FilterDrawer;
