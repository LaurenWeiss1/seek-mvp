import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';

const FilterPanel = ({ filters, setFilters }) => {
  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-semibold text-white">College</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          type="text"
          value={filters.college || ''}
          onChange={(e) => handleChange('college', e.target.value)}
          placeholder="Search by college"
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold text-white">Age</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          type="number"
          value={filters.age || ''}
          onChange={(e) => handleChange('age', e.target.value)}
          placeholder="Enter age"
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold text-white">Gender</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          value={filters.gender || ''}
          onChange={(e) => handleChange('gender', e.target.value)}
        >
          <option value="">Any</option>
          <option value="Woman">Woman</option>
          <option value="Man">Man</option>
          <option value="Transgender">Transgender</option>
          <option value="Non-binary/non-conforming">Non-binary/non-conforming</option>
          <option value="Prefer not to respond">Prefer not to respond</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-semibold text-white">Sexuality</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          value={filters.sexuality || ''}
          onChange={(e) => handleChange('sexuality', e.target.value)}
        >
          <option value="">Any</option>
          <option value="Asexual">Asexual</option>
          <option value="Bisexual">Bisexual</option>
          <option value="Gay">Gay</option>
          <option value="Heterosexual (straight)">Heterosexual (straight)</option>
          <option value="Lesbian">Lesbian</option>
          <option value="Pansexual">Pansexual</option>
          <option value="Queer">Queer</option>
          <option value="Questioning">Questioning</option>
          <option value="Prefer not to specify">Prefer not to specify</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-semibold text-white">Hometown</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          type="text"
          value={filters.hometown || ''}
          onChange={(e) => handleChange('hometown', e.target.value)}
          placeholder="Enter hometown"
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold text-white">Industry</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-gray-600"
          type="text"
          value={filters.industry || ''}
          onChange={(e) => handleChange('industry', e.target.value)}
          placeholder="Enter industry"
        />
      </div>
    </div>
  );
};

export default FilterPanel;
