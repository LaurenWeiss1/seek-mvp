// MapView.js — cleaned up version with heatmap completely removed
// Keeps emoji pins and city-based bar filtering

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchBarLocations } from './utils/barUtils';
import { getEmojiForBarType, getPopupContent } from './utils/mapUtils';
import FilterDrawer from './components/FilterDrawer';
import ModeToggle from './components/ModeToggle';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2Vla2FwcGxsYyIsImEiOiJjbTJtdm1zaTAwcjZkMmxwemgxamowOXR6In0.CmzCCRGriH_rka62M8GGlQ';

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [barLocations, setBarLocations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mode, setMode] = useState('hot');
  const [filters, setFilters] = useState({ gender: 'all', orientation: 'all', ageRange: [18, 100], college: 'all' });
  const [currentCity, setCurrentCity] = useState(null);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [longitude, latitude],
            zoom: 13,
          });

          const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
          });
          map.current.addControl(geocoder);

          geocoder.on('result', (e) => {
            const context = e.result.context || [];
            const place = context.find(c => c.id.includes('place'));
            const cityName = place?.text;
            if (cityName) {
              setCurrentCity(cityName);
              fetchBarLocations(setBarLocations, cityName);
            }
          });

          const cityFromCoords = await reverseGeocodeCity(latitude, longitude);
          if (cityFromCoords) {
            setCurrentCity(cityFromCoords);
            fetchBarLocations(setBarLocations, cityFromCoords);
          }
        },
        () => console.warn('Geolocation failed')
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        setUserProfile(snap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!map.current || barLocations.length === 0) return;

    barLocations.forEach((bar) => {
      if (!bar.lat || !bar.lng || isNaN(bar.lat) || isNaN(bar.lng)) return;

      const el = document.createElement('div');
      el.className = 'emoji-pin';
      el.style.fontSize = '24px';
      el.style.lineHeight = '1';
      el.style.cursor = 'pointer';
      el.textContent = getEmojiForBarType(bar.type);

      new mapboxgl.Marker(el)
        .setLngLat([bar.lng, bar.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(getPopupContent(bar, [], userProfile, mode, filters)))
        .addTo(map.current);
    });
  }, [barLocations, userProfile, mode, filters]);

  return (
    <div className="relative w-screen" style={{ height: '100vh' }}>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'match' && <FilterDrawer filters={filters} setFilters={setFilters} />}
      <div
        ref={mapContainer}
        className="absolute inset-0 z-0"
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      />
    </div>
  );
};

async function reverseGeocodeCity(lat, lng) {
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
  const res = await fetch(endpoint);
  const data = await res.json();
  const place = data.features.find(f => f.place_type.includes('place'));
  return place?.text || null;
}

export default MapView;
