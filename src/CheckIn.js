// src/CheckIn.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
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
  serverTimestamp
} from 'firebase/firestore';
import Papa from 'papaparse';
import { findNearestBar } from './utils/barUtils';

const genderOptions = [
  'Man', 'Woman', 'Transgender', 'Non-binary/non-conforming', 'Prefer not to respond'
];

const sexualityOptions = [
  'Heterosexual (straight)', 'Gay', 'Lesbian', 'Bisexual', 'Queer', 'Asexual', 'Pansexual', 'Questioning', 'Prefer not to specify'
];

const allUSStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

function CheckIn() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: '', sexuality: '', homeState: '', homeCountry: '', college: '', currentState: '', city: '', bar: '' });
  const [bars, setBars] = useState([]);
  const [barNotListed, setBarNotListed] = useState(false);
  const [customBar, setCustomBar] = useState('');
  const [location, setLocation] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn('Location access denied')
      );
    }
  }, []);

  useEffect(() => {
    const barSheet = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv';
    Papa.parse(barSheet, {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let nearestBar = null;
    if (location && bars.length > 0) {
      nearestBar = findNearestBar(location, bars);
    }

    const finalBar = barNotListed ? customBar : (formData.bar || nearestBar?.name);

    if (!user) {
      const wantsProfile = window.confirm('Want to save your info and create a profile?');
      if (wantsProfile) {
        alert('Redirect to sign up or create an account form here');
        return;
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          return;
        }
      }
    }

    try {
      await addDoc(collection(db, 'checkins'), {
        ...formData,
        bar: finalBar,
        barId: nearestBar?.id || null,
        lat: nearestBar?.lat || null,
        lng: nearestBar?.lng || null,
        city: nearestBar?.city || formData.city,
        timestamp: serverTimestamp()
      });

      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          ...formData,
          lastCheckIn: {
            bar: finalBar,
            city: formData.city,
            timestamp: new Date().toISOString()
          }
        }, { merge: true });
      }

      if (barNotListed && customBar) {
        await addDoc(collection(db, 'bars'), {
          name: customBar,
          city: formData.city,
          createdAt: serverTimestamp()
        });
      }

      alert(`✅ You’re checked in at ${finalBar}!`);
      navigate(`/bar/${finalBar}`);
    } catch (err) {
      console.error('Check-in error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] overflow-y-auto pt-20">
      <form onSubmit={handleSubmit} className="text-white max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-4xl font-bold text-center">Welcome to Seek <span className="inline-block">👋</span></h1>
        <>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />

        <input name="age" value={formData.age} onChange={handleChange} placeholder="Age" required className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />

        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Select Gender</option>
          {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select name="sexuality" value={formData.sexuality} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Select Sexuality</option>
          {sexualityOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select name="homeState" value={formData.homeState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Home State</option>
          {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {formData.homeState === "Not from the U.S." && (
          <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} placeholder="Home Country" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />
        )}

        <input name="college" value={formData.college} onChange={handleChange} placeholder="College" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />

        <select name="currentState" value={formData.currentState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Current State</option>
          {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {formData.currentState && (
          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />
        )}
        </>
        <button type="submit" className="w-full bg-gray-700 text-white py-2 rounded mt-4 hover:bg-gray-600">
          Submit
        </button>
      </form>
    </div>
  );
}

export default CheckIn;
