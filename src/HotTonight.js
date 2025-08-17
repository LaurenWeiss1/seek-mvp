import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import FilterPanel from './FilterPanel';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();

  const resolvePreferredCity = () => {
    const params = new URLSearchParams(location.search);
    const urlCity = params.get('city');
    if (urlCity) return urlCity;
    const stateCity = location.state && location.state.city;
    if (stateCity) return stateCity;
    const last = localStorage.getItem('lastCheckInCity');
    if (last) return last;
    try {
      const saved = JSON.parse(localStorage.getItem('checkinFormData') || '{}');
      if (saved?.city) return saved.city;
    } catch {}
    if (selectedCity) return selectedCity;
    return 'Berkeley';
  };

  useEffect(() => {
    const city = resolvePreferredCity();
    if (!city) {
      navigate('/checkin-landing', { replace: true });
      return;
    }
    setSelectedCity(city);
    localStorage.setItem('selectedCity', city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.state]);

  useEffect(() => {
    localStorage.setItem('fypFilters', JSON.stringify(filters));
  }, [filters]);

  const getBarSheetForCity = (city) => {
    const sheets = {
      'San Francisco': 'gid=1713497672',
      'Berkeley': 'gid=1529534222',
      'Oakland': 'gid=498638698',
      'Palo Alto': 'gid=543562265'
    };
    const base = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?single=true&output=csv';
    return sheets[city] ? `${base}&${sheets[city]}` : '';
  };

  // Load bars CSV for selected city
  useEffect(() => {
    if (!selectedCity) return;
    const sheet = getBarSheetForCity(selectedCity);
    if (!sheet) return;

    Papa.parse(`${sheet}&nocache=${Date.now()}`, {
      download: true,
      header: true,
      complete: (results) => {
        const raw = (results.data || [])
          .filter(row => row && row.bar && row.city)
          .map(row => {
            const name = row.bar.trim();
            return {
              id: name.replace(/\s+/g, '-').toLowerCase(),
              name,
              city: row.city.trim(),
              lat: row.latitude?.trim(),
              lng: row.longitude?.trim(),
              state: row.state?.trim() || '',
              normalizedBar: name.toLowerCase().trim(),
            };
          });

        setBars(raw);
      }
    });
  }, [selectedCity]);

  // Live check-ins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkins'), (snap) => {
      setCheckins(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  // Counts per bar in the last 12h
  const countsMap = useMemo(() => {
    const map = new Map();
    const now = Date.now();
    const WINDOW_MS = 12 * 60 * 60 * 1000;
    for (const ci of checkins) {
      const key = ci.normalizedBar || ci.bar?.toLowerCase()?.trim();
      if (!key) continue;
      let within = true;
      if (ci.timestamp?.toDate) {
        const ts = ci.timestamp.toDate().getTime();
        within = (now - ts) <= WINDOW_MS;
      }
      if (!within) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [checkins]);

  const barsWithCounts = useMemo(
    () => bars.map(b => ({ ...b, count: countsMap.get(b.normalizedBar) || 0 })),
    [bars, countsMap]
  );

  const listToRender = useMemo(() => {
    let list = barsWithCounts;
    if (mode === 'search' && barSearch) {
      const q = barSearch.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q));
    } else if (mode === 'trending') {
      list = [...list].sort((a, b) => b.count - a.count).slice(0, topCount);
    }
    return list;
  }, [barsWithCounts, mode, barSearch, topCount]);

  const openDirections = (lat, lng) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const goToBar = (barName) => {
    if (!barName) return;
    navigate(`/barview/${encodeURIComponent(barName)}`, {
      state: { city: selectedCity }
    });
  };

  return (
    <div className="relative min-h-screen p-6 text-white" style={{ backgroundColor: "#0b0d12", backgroundImage: "url('/custom-grid.png')", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold text-center mb-8">
          {mode === 'filter'
            ? `Filter Bars in ${selectedCity}`
            : mode === 'search'
            ? `Search Bars in ${selectedCity}`
            : `Trending in ${selectedCity}`} 🍸
        </h1>

        {/* City chat quick access */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => navigate('/chat', { state: { forceCity: true, city: selectedCity } })}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition"
            title={`Open city group chat for ${selectedCity}`}
          >
            🌆 Open City Chat
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 min-h-[44px]">
          <div className="flex flex-1 justify-start gap-2 items-center">
            {mode === 'trending' && (
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${topCount === n ? 'bg-white text-black' : 'bg-white/10'}`}
                    onClick={() => setTopCount(n)}
                  >
                    Top {n}
                  </button>
                ))}
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
            <button
              className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'trending' ? 'text-black' : 'text-white'}`}
              style={{ backgroundColor: mode === 'trending' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setMode('trending')}
            >
              Trending
            </button>
            <button
              className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'filter' ? 'text-black' : 'text-white'}`}
              style={{ backgroundColor: mode === 'filter' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setMode('filter')}
            >
              Filter
            </button>
            <button
              className={`px-5 py-2 rounded-lg font-semibold transition ${mode === 'search' ? 'text-black' : 'text-white'}`}
              style={{ backgroundColor: mode === 'search' ? '#A1C5E6' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setMode('search')}
            >
              Search by Bar
            </button>
          </div>
        </div>

        {mode === 'filter' && (
          <div className="bg-white/5 p-4 rounded-xl border border-gray-500 mb-6">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
            />
            <div className="text-center mt-4">
              <button
                onClick={() => setHasSearched(true)}
                className="bg-[#A1C5E6] text-black font-bold py-2 px-6 rounded-xl hover:bg-[#90B8DE] transition"
              >
                Search Bars
              </button>
            </div>
          </div>
        )}

        {mode === 'filter' && hasSearched && listToRender.length === 0 && (
          <p className="text-center text-gray-300 mb-4">
            Couldn't find someone that checked all of your boxes, but a few come pretty close...
          </p>
        )}

        <ul className="space-y-5">
          {listToRender.map((bar, i) => (
            <li
              key={bar.id}
              role="button"
              tabIndex={0}
              onClick={() => goToBar(bar.name)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToBar(bar.name)}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-700 transition hover:bg-white/20 hover:scale-[1.01] text-white cursor-pointer"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {mode === 'trending' ? `#${i + 1} ` : ''}{bar.name}
                  </h2>
                  <p className="text-sm text-gray-300">{bar.city}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-semibold text-white">👥 {bar.count}</span>
                  {bar.lat && bar.lng && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDirections(bar.lat, bar.lng);
                      }}
                      className="px-3 py-1 text-lg bg-[#A1C5E6] text-black rounded-lg hover:bg-[#90B8DE] transition"
                    >
                      🧭
                    </button>
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
