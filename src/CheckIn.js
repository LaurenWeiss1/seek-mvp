import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import Papa from 'papaparse';
import {
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { differenceInHours } from 'date-fns';

const cityBarDataSources = {
  Berkeley: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1529534222&single=true&output=csv",
  "San Francisco": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1713497672&single=true&output=csv",
  Oakland: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=498638698&single=true&output=csv",
  "Palo Alto": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=543562265&single=true&output=csv"
};

const genderOptions = [
  'Man', 'Woman', 'Transgender', 'Non-binary/non-conforming', 'Prefer not to respond'
];
const sexualityOptions = [
  'Heterosexual (straight)', 'Gay', 'Lesbian', 'Bisexual', 'Queer', 'Asexual', 'Pansexual', 'Questioning', 'Prefer not to specify'
];
const allUSStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Not from the U.S.'
];

async function getLastCheckin(uid) {
  const checkinsRef = collection(db, "checkins");
  const q = query(
    checkinsRef,
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

// ================== GViz helpers (with robust URL + multi bar types) ==================

const BAR_MIN_CHARS = 1;               // fire searches quickly
const INITIAL_FETCH_LIMIT = 50;
const TYPING_FETCH_LIMIT = 50;
const DEBOUNCE_MS = 220;

// Parse a bar-type string into an array: supports commas, pipes, slashes, semicolons
const parseBarTypesString = (s) => {
  if (!s) return [];
  return s
    .split(/[,/|;]+/g)
    .map(t => t.trim())
    .filter(Boolean);
};

// Build a GViz query URL from your published CSV link
const gvizQueryUrl = (csvUrl, tq) => {
  // /pub? -> /gviz/tq?
  let base = csvUrl.replace(/\/pub\?/, '/gviz/tq?');
  // strip output=csv & single=true & usp=sharing (if present)
  base = base.replace(/[?&]output=csv/gi, '');
  base = base.replace(/[?&]single=true/gi, '');
  base = base.replace(/[?&]usp=sharing/gi, '');
  base = base.replace(/#.*$/, '');
  // tidy any leftover "&&" or "?&"
  base = base.replace(/\?&/, '?').replace(/&&/, '&').replace(/\?$/, '');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}tqx=out:json&tq=${encodeURIComponent(tq)}`;
};

// Debounced per-keystroke query. No "city" column dependency; each gid is city-specific.
const makeBarLoader = (csvUrl, fallbackListRef) => {
  let timeoutId;
  let lastController;

  return (inputValue, callback) => {
    clearTimeout(timeoutId);
    if (lastController) lastController.abort();

    const needle = (inputValue || '').trim().toLowerCase();
    const isInitial = needle.length === 0;
    const limit = isInitial ? INITIAL_FETCH_LIMIT : TYPING_FETCH_LIMIT;

    const whereClause = isInitial
      ? ''
      : `where lower(A) contains '${needle.replace(/'/g, "\\'")}'`;

    const tq = `
      select A,C,D,E
      ${whereClause}
      order by A
      limit ${limit}
    `;
    const url = gvizQueryUrl(csvUrl, tq);

    timeoutId = setTimeout(async () => {
      try {
        lastController = new AbortController();
        const res = await fetch(url, { signal: lastController.signal });
        const txt = await res.text();
        const json = JSON.parse(txt.replace(/^[^{]+/, '').replace(/;?\s*$/, ''));
        const rows = json.table?.rows || [];

        let options = rows.map(r => {
          const name = (r.c[0]?.v || '').toString().trim();            // A
          const lat  = r.c[1]?.v != null ? Number(r.c[1].v) : null;    // C
          const lng  = r.c[2]?.v != null ? Number(r.c[2].v) : null;    // D
          const typeRaw = (r.c[3]?.v || '').toString().trim();         // E
          const barTypes = parseBarTypesString(typeRaw);
          return { value: name, label: name, meta: { name, lat, lng, barTypes, typeRaw } };
        });

        // Fallback to CSV-parsed list if GViz returns nothing (so menu isn't blank)
        if (options.length === 0 && fallbackListRef.current.length > 0) {
          const src = fallbackListRef.current;
          const filtered = isInitial
            ? src.slice(0, INITIAL_FETCH_LIMIT)
            : src.filter(o => o.label.toLowerCase().includes(needle)).slice(0, TYPING_FETCH_LIMIT);
          options = filtered.map(o => ({
            value: o.value,
            label: o.label,
            meta: { name: o.label, lat: o.lat, lng: o.lng, barTypes: [], typeRaw: '' }
          }));
        }

        callback(options);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('GViz fetch/parse error:', e);
          // hard fallback to CSV-parsed list
          const src = fallbackListRef.current;
          const filtered = isInitial
            ? src.slice(0, INITIAL_FETCH_LIMIT)
            : src.filter(o => o.label.toLowerCase().includes(needle)).slice(0, TYPING_FETCH_LIMIT);
          const options = filtered.map(o => ({
            value: o.value,
            label: o.label,
            meta: { name: o.label, lat: o.lat, lng: o.lng, barTypes: [], typeRaw: '' }
          }));
          callback(options);
        }
      }
    }, DEBOUNCE_MS);
  };
};

// ================================================================================

console.log('[CheckIn] module loaded');

function CheckIn({ onComplete }) {
  console.log('[CheckIn] render start');

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [recentCheckin, setRecentCheckin] = useState(null);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', sexuality: '', homeState: '',
    homeCountry: '', college: '', city: '', bar: ''
  });
  const [bars, setBars] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [barNotListed, setBarNotListed] = useState(false);
  const [customBar, setCustomBar] = useState('');
  const [error, setError] = useState('');
  const [notAtBar, setNotAtBar] = useState(false);
  const [showNotAtBarPage, setShowNotAtBarPage] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Keep selected bar types (from column E) if you want to store/use them later
  const [selectedBarTypes, setSelectedBarTypes] = useState([]);

  // A ref mirror of `bars` for GViz fallback
  const barsRef = React.useRef([]);
  useEffect(() => { barsRef.current = bars; }, [bars]);

  // Memoized loader for AsyncSelect (GViz + fallback)
  const barLoadOptions = useMemo(() => {
    const csvUrl = cityBarDataSources[formData.city];
    return csvUrl
      ? makeBarLoader(csvUrl, barsRef)
      : (inputValue, callback) => callback([]);
  }, [formData.city]);

  // Always clear city and bar when CheckIn is shown
  useEffect(() => {
    console.log('[CheckIn] mount: clearing city/bar');
    setFormData(prev => ({ ...prev, city: '', bar: '' }));
    setBars([]);
  }, []);

  useEffect(() => {
    console.log('[CheckIn] auth effect subscribing');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[CheckIn] onAuthStateChanged', !!currentUser);
      setUser(currentUser);

      if (currentUser) {
        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const profile = snap.data();
          setFormData(prev => ({
            ...prev,
            name: profile.name || '',
            age: profile.age || '',
            gender: profile.gender || '',
            sexuality: profile.sexuality || '',
            college: profile.school || profile.college || '',
            homeState: profile.homeState || '',
            homeCountry: profile.homeCountry || '',
            homeCity: profile.homeCity || ''
          }));
        }

        const last = await getLastCheckin(currentUser.uid);
        if (last && last.timestamp && typeof last.timestamp.toDate === 'function') {
          try {
            const hoursAgo = differenceInHours(new Date(), last.timestamp.toDate());
            if (hoursAgo < 6) {
              setRecentCheckin(last);
              setFormData(prev => ({
                ...prev,
                gender: last.gender || prev.gender,
                sexuality: last.sexuality || prev.sexuality,
                homeState: last.homeState || prev.homeState,
                homeCountry: last.homeCountry || prev.homeCountry,
                college: last.college || prev.college
              }));
            }
          } catch (e) {
            console.warn('Failed to process last checkin timestamp', e);
          }
        }
      } else {
        const anonData = localStorage.getItem('anonRecentCheckin');
        if (anonData) {
          const parsed = JSON.parse(anonData);
          const hoursAgo = differenceInHours(new Date(), new Date(parsed.timestamp));
          if (hoursAgo < 6) {
            setRecentCheckin(parsed);
          }
        }
      }
    });
    return () => { console.log('[CheckIn] auth unsubscribe'); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!formData.city || !cityBarDataSources[formData.city]) {
      setBars([]);
      return;
    }
    Papa.parse(cityBarDataSources[formData.city], {
      download: true,
      header: true,
      complete: (results) => {
        const barList = results.data.map(row => ({
          label: (row.bar || row['bar name'] || row['Bar'] || row['Bar Name'] || '').trim(),
          value: (row.bar || row['bar name'] || row['Bar'] || row['Bar Name'] || '').trim(),
          lat: parseFloat(row.latitude ?? row.Latitude ?? row.LATITUDE),
          lng: parseFloat(row.longitude ?? row.Longitude ?? row.LONGITUDE)
        })).filter(b => b.label && !isNaN(b.lat) && !isNaN(b.lng));

        setBars(barList);
      }
    });
  }, [formData.city]);

  useEffect(() => {
    const collegeSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=576309257&single=true&output=csv";
    Papa.parse(collegeSheet, {
      download: true,
      header: true,
      complete: (results) => {
        const list = results.data.map(row => row.college?.trim()).filter(Boolean);
        setColleges(Array.from(new Set(list)).sort());
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setBars([]);
      setFormData(prev => ({
        ...prev,
        city: value,
        bar: ''
      }));
      setBarNotListed(false);
      setCustomBar('');
      setSelectedBarTypes([]);
    } else if (name === 'age') {
      const n = parseInt(value, 10);
      if (isNaN(n)) {
        setFormData(prev => ({ ...prev, age: '' }));
      } else {
        setFormData(prev => ({ ...prev, age: n < 21 ? 21 : n }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name || !formData.name.trim()) {
      setError("Please enter your name.");
      setShowErrorPopup(true);
      return;
    }
    if (!formData.age || parseInt(formData.age, 10) < 21) {
      setError("You must be 21 or older to check in.");
      setShowErrorPopup(true);
      return;
    }
    if (!formData.gender) {
      setError("Please select your gender.");
      setShowErrorPopup(true);
      return;
    }
    if (!formData.sexuality) {
      setError("Please select your sexuality.");
      setShowErrorPopup(true);
      return;
    }
    if (!formData.city) {
      setError("Please select your city.");
      setShowErrorPopup(true);
      return;
    }

    const finalBar = barNotListed ? customBar.trim() : formData.bar;

    if (!finalBar && !notAtBar) {
      setError("Oops! You must select which bar you're at.");
      setShowErrorPopup(true);
      return;
    }
    if (barNotListed && finalBar.length > 60) {
      setError("Bar name too long (max 60).");
      setShowErrorPopup(true);
      return;
    }

    setError('');
    setShowErrorPopup(false);

    if (notAtBar) {
      setShowNotAtBarPage(true);
      return;
    }

    try {
      setSubmitting(true);

      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.error('Anon sign-in failed', authErr);
          setError('Sign-in failed. Try again.');
          setShowErrorPopup(true);
          setSubmitting(false);
          return;
        }
      }

      await addDoc(collection(db, 'checkins'), {
        ...formData,
        bar: finalBar,
        uid: auth.currentUser ? auth.currentUser.uid : null,
        timestamp: serverTimestamp(),
        normalizedBar: finalBar.toLowerCase().trim()
        // If later you want to store barTypes: barTypes: selectedBarTypes
      });

      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          sexuality: formData.sexuality,
          college: formData.college,
          homeState: formData.homeState,
          homeCountry: formData.homeCountry,
          lastCheckIn: { bar: finalBar, city: formData.city, ts: new Date().toISOString() }
        }, { merge: true });
      } else {
        localStorage.setItem('anonRecentCheckin', JSON.stringify({
          bar: finalBar,
          city: formData.city,
          timestamp: new Date().toISOString()
        }));
      }

      const userInfo = {
        gender: formData.gender,
        sexuality: formData.sexuality,
        college: formData.college,
        homeState: formData.homeState,
        homeCountry: formData.homeCountry
      };

      localStorage.removeItem('notAtBar');

      localStorage.setItem('checkInTimestamp', new Date().toISOString());
      localStorage.setItem('lastCheckInBar', finalBar);
      localStorage.setItem('lastCheckInCity', formData.city);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('skipCheckInGate', '1');

      localStorage.setItem('selectedCity', formData.city);

      if (onComplete) {
        onComplete({ bar: finalBar, city: formData.city, userInfo });
      }

      navigate(`/barview/${encodeURIComponent(finalBar)}`, {
        replace: true,
        state: { city: formData.city }
      });

    } catch (err) {
      console.error('Check-in failed', err);
      setError('Failed to submit. Retry.');
      setShowErrorPopup(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (showNotAtBarPage) {
    return (
      <div
        className="relative min-h-screen w-screen flex flex-col items-center justify-center text-center"
        style={{
          backgroundColor: "#0b0d12",
          backgroundImage: "url('/custom-grid.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10 max-w-xl mx-auto p-6 text-white">
          <h1 className="text-3xl font-bold mb-6">You're not currently checked into a bar.</h1>
          <button
            className="bg-[#A1C5E6] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-[#90B8DE] transition"
            onClick={() => {
              localStorage.setItem('notAtBar', 'true');
              setNotAtBar(false);
              setShowNotAtBarPage(false);
              navigate('/bar/none');
            }}
          >
            Continue to app
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-screen flex flex-col items-center justify-center text-center"
      style={{
        backgroundColor: "#0b0d12",
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 max-w-xl mx-auto p-6 text-white">
        <h1 className="text-3xl font-bold mb-6">Check In</h1>

        {/* Error Popup */}
        {showErrorPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white text-black rounded-xl shadow-lg p-8 max-w-xs w-full flex flex-col items-center">
              <div className="mb-4 text-lg font-semibold">{error}</div>

              {/* Show "I'm not at a bar" ONLY when the bar itself is missing */}
              {error.includes("which bar you're at") && (
                <button
                  type="button"
                  className="mb-2 py-2 px-4 rounded-xl bg-gray-700 text-white w-full"
                  onClick={() => {
                    localStorage.setItem('notAtBar', 'true');
                    setShowErrorPopup(false);
                    setError('');
                    navigate('/bar/none');
                  }}
                >
                  I'm not at a bar
                </button>
              )}

              <button
                type="button"
                className="py-2 px-4 rounded-xl bg-gray-300 text-black w-full"
                onClick={() => setShowErrorPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* noValidate so we control errors with the popup */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />

          {/* AGE — enforce 21+ */}
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            min={21}
            required
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />

          {/* Gender (custom-required via JS; keeping markup simple) */}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white text-black"
          >
            <option value="">Select Gender</option>
            {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Sexuality (custom-required via JS) */}
          <select
            name="sexuality"
            value={formData.sexuality}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white text-black"
          >
            <option value="">Select Sexuality</option>
            {sexualityOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select name="homeState" value={formData.homeState} onChange={handleChange} className="w-full p-3 rounded-xl bg-white text-black">
            <option value="">Home State</option>
            {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
          </select>

          {formData.homeState === "Not from the U.S." && (
            <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} placeholder="Home Country" className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          )}

          {/* College searchable dropdown before city */}
          <Select
            name="college"
            inputId="college"
            options={colleges.map(college => ({ label: college, value: college }))}
            value={formData.college ? { label: formData.college, value: formData.college } : null}
            onChange={selected => setFormData(prev => ({ ...prev, college: selected ? selected.value : '' }))}
            placeholder="Select College/University"
            isClearable
            isSearchable
            styles={{
              control: base => ({ ...base, backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }),
              input: base => ({ ...base, color: 'white' }),
              singleValue: base => ({ ...base, color: 'white' }),
              menu: base => ({ ...base, backgroundColor: '#1f2937', color: 'white' }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected
                  ? '#4b5563' // selected
                  : state.isFocused
                  ? '#374151' // hover/focus
                  : 'transparent',
                color: 'white'
              })
            }}
          />

          {/* City dropdown */}
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white text-black"
            required
          >
            <option value="">Select City</option>
            <option value="San Francisco">San Francisco</option>
            <option value="Berkeley">Berkeley</option>
            <option value="Oakland">Oakland</option>
            <option value="Palo Alto">Palo Alto</option>
          </select>

          {/* Bar Select now Async (GViz + fallback) */}
          <AsyncSelect
            key={formData.city}
            cacheOptions
            defaultOptions={true}  // fetch initial list from GViz
            loadOptions={barLoadOptions}
            value={formData.bar ? { label: formData.bar, value: formData.bar } : null}
            onChange={selected => {
              setFormData(prev => ({ ...prev, bar: selected ? selected.value : '' }));
              setSelectedBarTypes(selected?.meta?.barTypes || []);
            }}
            placeholder="Start typing bar name..."
            isClearable
            isSearchable
            noOptionsMessage={() => formData.city ? "No matching bars" : "Select a city first"}
            styles={{
              control: base => ({ ...base, backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }),
              input: base => ({ ...base, color: 'white' }),
              singleValue: base => ({ ...base, color: 'white' }),
              menu: base => ({ ...base, backgroundColor: '#1f2937', color: 'white' }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected
                  ? '#4b5563'
                  : state.isFocused
                  ? '#374151'
                  : 'transparent',
                color: 'white'
              })
            }}
          />

          {barNotListed && (
            <input name="customBar" value={customBar} onChange={e => setCustomBar(e.target.value)} placeholder="Enter Bar Name" className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white" />
          )}

          <div className="text-sm text-gray-300 text-center">
            Don’t see your bar?{' '}
            <span className="underline cursor-pointer" onClick={() => setBarNotListed(true)}>Add it manually</span>
          </div>

          <button type="submit" disabled={submitting} className="w-full text-white py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50" style={{ backgroundColor: '#A1C5E6', color: '#000' }}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckIn;
