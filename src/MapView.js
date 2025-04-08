// ✅ FINAL FIXED VERSION — WORKING HEATMAP, FILTER DRAWER, SEARCH BAR
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import Papa from 'papaparse';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2Vla2FwcGxsYyIsImEiOiJjbTJtdm1zaTAwcjZkMmxwemgxamowOXR6In0.CmzCCRGriH_rka62M8GGlQ';

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [barLocations, setBarLocations] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [genderFilter, setGenderFilter] = useState('all');
  const [orientationFilter, setOrientationFilter] = useState('all');
  const [ageRange, setAgeRange] = useState([18, 100]);
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Load user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserProfile(snap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Load bar data and college options
  useEffect(() => {
    Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv", {
      download: true,
      header: true,
      complete: (results) => {
        const bars = results.data.filter(r => r.latitude && r.longitude).map(row => ({
          name: row["bar"],
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude),
          type: row.type || ''
        }));
        setBarLocations(bars);
        const colleges = [...new Set(results.data.map(row => row.college).filter(Boolean))].sort();
        setCollegeOptions(colleges);
      }
    });
  }, []);

  // ✅ Subscribe to checkins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkins'), (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setCheckins(data);
    });
    return () => unsub();
  }, []);

  // ✅ Map Initialization
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/seekappllc/cm94qthl2004k01sx2sht8otc',
      center: [-122.2727, 37.8716],
      zoom: 13
    });

    map.current.on('load', () => {
      map.current.addSource('checkins', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'checkin-heat',
        type: 'heatmap',
        source: 'checkins',
        maxzoom: 22,
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.5,
          'heatmap-radius': 30,
          'heatmap-opacity': 0.6,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ]
        }
      });

      // ✅ Geocoder
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        marker: false,
        zoom: 13,
        placeholder: 'Search for a city...'
      });
      map.current.addControl(geocoder, 'top-left');
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });
  }, []);

  // ✅ Update heatmap with filtered checkins
  useEffect(() => {
    if (!map.current || barLocations.length === 0) return;
    const filtered = checkins.filter(c => {
      const genderMatch = genderFilter === 'all' || c.gender === genderFilter;
      const orientationMatch = orientationFilter === 'all' || c.sexuality === orientationFilter;
      const ageMatch = c.age >= ageRange[0] && c.age <= ageRange[1];
      const collegeMatch = collegeFilter === 'all' || c.college === collegeFilter;
      return genderMatch && orientationMatch && ageMatch && collegeMatch && c.bar;
    });
    const barWeights = {};
    filtered.forEach(c => {
      const barKey = c.bar?.toLowerCase();
      if (!barKey) return;
      barWeights[barKey] = (barWeights[barKey] || 0) + 1;
    });
    const features = barLocations.map((bar, i) => {
      const key = bar.name.toLowerCase();
      const weight = barWeights[key] || 0.1;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [bar.lng, bar.lat] },
        properties: { weight }
      };
    });
    const src = map.current.getSource('checkins');
    if (src) src.setData({ type: 'FeatureCollection', features });
  }, [checkins, genderFilter, orientationFilter, ageRange, collegeFilter, barLocations]);

  // ✅ Render emoji pins
  useEffect(() => {
    if (!map.current) return;
    document.querySelectorAll('.bar-marker').forEach(el => el.remove());
    barLocations.forEach(bar => {
      const el = document.createElement('div');
      el.className = 'bar-marker';
      el.innerText = '🍻';
      el.style.fontSize = '32px';
      el.style.cursor = 'pointer';
      el.onclick = () => {
        new mapboxgl.Popup()
          .setLngLat([bar.lng, bar.lat])
          .setHTML(`<strong>${bar.name}</strong><br/>Type: ${bar.type || 'Bar'}`)
          .addTo(map.current);
      };
      new mapboxgl.Marker(el).setLngLat([bar.lng, bar.lat]).addTo(map.current);
    });
  }, [barLocations]);

  return (
    <div className="w-full h-full relative">
      <button onClick={() => setDrawerOpen(!drawerOpen)} className="absolute top-4 left-4 z-20 p-2 bg-white rounded shadow md:hidden">
        {drawerOpen ? 'Close Filters' : 'Open Filters'}
      </button>

      <div className={`fixed top-16 right-0 z-20 bg-white shadow w-64 h-[90vh] overflow-y-auto p-4 space-y-4 text-sm transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static`}>
        <div className="flex items-center justify-between">
          <span>Show Heatmap</span>
          <input type="checkbox" checked={showHeatmap} onChange={() => {
            const visible = !showHeatmap;
            setShowHeatmap(visible);
            if (map.current?.getLayer('checkin-heat')) {
              map.current.setLayoutProperty('checkin-heat', 'visibility', visible ? 'visible' : 'none');
            }
          }} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Gender</label>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="Woman">Woman</option>
            <option value="Man">Man</option>
            <option value="Non-binary/non-conforming">Non-binary</option>
            <option value="Transgender">Transgender</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Sexuality</label>
          <select value={orientationFilter} onChange={(e) => setOrientationFilter(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="Heterosexual (straight)">Straight</option>
            <option value="Gay">Gay</option>
            <option value="Lesbian">Lesbian</option>
            <option value="Bisexual">Bisexual</option>
            <option value="Pansexual">Pansexual</option>
            <option value="Queer">Queer</option>
            <option value="Asexual">Asexual</option>
            <option value="Questioning">Questioning</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Age Range</label>
          <div className="flex space-x-2">
            <input type="number" min="18" max="100" value={ageRange[0]} onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])} className="w-1/2 border rounded px-2 py-1" />
            <input type="number" min="18" max="100" value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])} className="w-1/2 border rounded px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">College</label>
          <select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="all">All</option>
            {collegeOptions.map(college => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>
        </div>
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapView;
