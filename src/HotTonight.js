// HotTonight.js — now using bar data from Google Sheet
import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onSnapshot, collection, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Papa from 'papaparse';

const BAR_SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv';

const HotTonight = () => {
  const [bars, setBars] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [mode, setMode] = useState('hot');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    Papa.parse(BAR_SHEET, {
      download: true,
      header: true,
      complete: (results) => {
        const barList = results.data.map(row => ({
          id: row.id || row.bar,
          name: row.bar,
          city: row.city,
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude)
        })).filter(b => b.name && b.city);
        setBars(barList);
      }
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkins'), (snap) => {
      setCheckins(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      }
    });
    return () => unsub();
  }, []);

  const getFilteredCheckins = () => {
    if (mode === 'hot') return checkins;
    if (!userProfile) return [];

    return checkins.filter(ci => {
      const ageOk = ci.age >= 18 && ci.age <= 100;
      const genderOk = userProfile.preferences?.gender
        ? ci.gender === userProfile.preferences.gender
        : true;
      const orientationOk = userProfile.preferences?.orientation
        ? ci.orientation === userProfile.preferences.orientation
        : true;
      return ageOk && genderOk && orientationOk;
    });
  };

  const barActivity = bars
    .filter(bar => userProfile?.city && bar.city?.toLowerCase() === userProfile.city.toLowerCase())
    .map(bar => {
      const count = getFilteredCheckins().filter(ci => ci.bar === bar.name).length;
      return { ...bar, count };
    })
    .filter(bar => bar.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Hot Tonight 🔥</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('hot')}
          className={`px-4 py-2 rounded ${mode === 'hot' ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          Trending Now
        </button>
        <button
          onClick={() => setMode('match')}
          className={`px-4 py-2 rounded ${mode === 'match' ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          Matching Your Preferences
        </button>
      </div>

      <ul className="space-y-2">
        {barActivity.map((bar, i) => (
          <li key={i} className="p-3 rounded bg-white shadow text-black">
            <strong>{bar.name}</strong> — {bar.city} — {bar.count} check-in{bar.count !== 1 ? 's' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HotTonight;
