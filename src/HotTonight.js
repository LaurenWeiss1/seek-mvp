import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import FilterPanel from './FilterPanel';
import { useNavigate } from 'react-router-dom';
import { rankCheckinsByFilterPriority } from './utils/filterRanking';

const HotTonight = () => {
  const [bars, setBars] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [mode, setMode] = useState('trending');
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('fypFilters');
    return saved ? JSON.parse(saved) : {};
  });
  const [filterPriority, setFilterPriority] = useState([
    'college', 'age', 'gender', 'sexuality', 'hometown', 'industry'
  ]);
  const [selectedCity, setSelectedCity] = useState('');
  const [topCount, setTopCount] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [barSearch, setBarSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const city = localStorage.getItem('selectedCity') || '';
    if (!city) {
      navigate('/checkin-city');
      return;
    }
    setSelectedCity(city);
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('fypFilters', JSON.stringify(filters));
  }, [filters]);

  const getBarSheetForCity = (city) => {
    const sheets = {
      'San Francisco': 'gid=1713497672',
      'Berkeley': 'gid=1529534222',
      'Oakland': 'gid=498638698',
     // 'Marin': 'gid=447070284',
      'Palo Alto': 'gid=543562265'
    };
    const base = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?single=true&output=csv';
    return sheets[city] ? `${base}&${sheets[city]}` : '';
  };

  useEffect(() => {
    const sheet = getBarSheetForCity(selectedCity);
    if (!sheet) return;

    Papa.parse(`${sheet}&nocache=${Date.now()}`, {
      download: true,
      header: true,
      complete: (results) => {
        const rawBars = results.data
          .filter(row => row && row.bar && row.city)
          .map(row => ({
            id: row.bar.trim().replace(/\s+/g, '-').toLowerCase(),
            name: row.bar.trim(),
            city: row.city.trim(),
            lat: row.latitude?.trim(),
            lng: row.longitude?.trim(),
            state: row.state?.trim() || ''
          }));
        setBars(rawBars);
      }
    });
  }, [selectedCity]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkins'), (snap) => {
      setCheckins(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  const getDemographics = (checkins) => {
    const ageGroups = { '20s': 0, '30s': 0, '40s': 0, '50+': 0 };
    const genderCounts = { female: 0, male: 0, nonbinary: 0 };
    const colleges = {};
    checkins.forEach(ci => {
      const age = parseInt(ci.age);
      if (age >= 20 && age < 30) ageGroups['20s']++;
      else if (age >= 30 && age < 40) ageGroups['30s']++;
      else if (age >= 40 && age < 50) ageGroups['40s']++;
      else if (age >= 50) ageGroups['50+']++;

      const g = ci.gender?.toLowerCase();
      if (g === 'female') genderCounts.female++;
      else if (g === 'male') genderCounts.male++;
      else genderCounts.nonbinary++;

      if (ci.college) {
        const college = ci.college.trim();
        colleges[college] = (colleges[college] || 0) + 1;
      }
    });
    const total = checkins.length || 1;
    return {
      ageGroups: Object.fromEntries(Object.entries(ageGroups).map(([k, v]) => [k, ((v / total) * 100).toFixed(0)])),
      genderPercents: Object.fromEntries(Object.entries(genderCounts).map(([k, v]) => [k, ((v / total) * 100).toFixed(0)])),
      colleges
    };
  };

  const filteredBars = bars.filter(bar =>
    mode === 'search' && barSearch
      ? bar.name.toLowerCase().includes(barSearch.toLowerCase())
      : true
  );

  const openDirections = (lat, lng) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative min-h-screen p-6 text-white" style={{ backgroundColor: "#0b0d12", backgroundImage: "url('/custom-grid.png')", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold text-center mb-8">
          {mode === 'filter' ? `Filter Bars in ${selectedCity}` : mode === 'search' ? `Search Bars in ${selectedCity}` : `Trending in ${selectedCity}`} 🍸
        </h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 min-h-[44px]">
          <div className="flex flex-1 justify-start gap-2 items-center">
            {mode === 'trending' && (
              <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-lg font-semibold transition ${topCount === 5 ? 'bg-white text-black' : 'bg-white/10'}`} onClick={() => setTopCount(5)}>Top 5</button>
                <button className={`px-4 py-2 rounded-lg font-semibold transition ${topCount === 10 ? 'bg-white text-black' : 'bg-white/10'}`} onClick={() => setTopCount(10)}>Top 10</button>
                <button className={`px-4 py-2 rounded-lg font-semibold transition ${topCount === 15 ? 'bg-white text-black' : 'bg-white/10'}`} onClick={() => setTopCount(15)}>Top 15</button>
                <button className={`px-4 py-2 rounded-lg font-semibold transition ${topCount === 20 ? 'bg-white text-black' : 'bg-white/10'}`} onClick={() => setTopCount(20)}>Top 20</button>
              </div>
            )}
            {mode === 'search' && (
              <input
                type="text"
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-gray-500 w-full"
                placeholder="Search bars in your city..."
                value={barSearch}
                onChange={(e) => setBarSearch(e.target.value)}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'trending' ? 'text-black' : 'text-white'}`} style={{ backgroundColor: mode === 'trending' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }} onClick={() => setMode('trending')}>Trending</button>
            <button className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'filter' ? 'text-black' : 'text-white'}`} style={{ backgroundColor: mode === 'filter' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }} onClick={() => setMode('filter')}>Filter</button>
            <button className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'search' ? 'text-black' : 'text-white'}`} style={{ backgroundColor: mode === 'search' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }} onClick={() => setMode('search')}>Search by Bar</button>
          </div>
        </div>

        {mode === 'filter' && (
          <div className="bg-white/5 p-4 rounded-xl border border-gray-500 mb-6">
            <FilterPanel filters={filters} setFilters={setFilters} filterPriority={filterPriority} setFilterPriority={setFilterPriority} />
            <div className="text-center mt-4">
              <button onClick={() => setHasSearched(true)} className="bg-[#A1C5E6] text-black font-bold py-2 px-6 rounded-xl hover:bg-[#90B8DE] transition">Search Bars</button>
            </div>
          </div>
        )}

        {mode === 'filter' && hasSearched && filteredBars.length === 0 && (
          <p className="text-center text-gray-300 mb-4">Couldn't find someone that checked all of your boxes, but a few come pretty close...</p>
        )}

        <ul className="space-y-5">
          {filteredBars.map((bar, i) => (
            <li key={bar.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-700 transition hover:bg-white/20 hover:scale-[1.01] text-white">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white">#{i + 1} {bar.name}</h2>
                  <p className="text-sm text-gray-300">{bar.city}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-semibold text-white">👥 {bar.count || 0} check-ins</span>
                  {bar.lat && bar.lng && (
                    <button onClick={() => openDirections(bar.lat, bar.lng)} className="px-3 py-1 text-lg bg-[#A1C5E6] text-black rounded-lg hover:bg-[#90B8DE] transition">🧭</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HotTonight;
