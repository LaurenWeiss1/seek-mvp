// utils/barUtils.js
import Papa from 'papaparse';

const BAR_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv';

export async function fetchBarLocations(setBarLocations, cityFilter = null) {
  Papa.parse(BAR_SHEET_URL, {
    download: true,
    header: true,
    complete: (results) => {
      const barList = results.data.map(row => ({
        id: row.id || row.bar || row.name,
        name: row.bar || row.name,
        city: row.city,
        type: row.type || 'default',
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        website: row.website || null,
        imageUrl: row.imageUrl || null
      })).filter(b => b.name && !isNaN(b.lat) && !isNaN(b.lng));

      const filteredList = cityFilter
        ? barList.filter(b => b.city?.toLowerCase() === cityFilter.toLowerCase())
        : barList;

      setBarLocations(filteredList);
    },
    error: (err) => {
      console.error('Failed to load bar sheet:', err);
      setBarLocations([]);
    }
  });
}

export function findNearestBar(userLocation, bars) {
  let nearest = null;
  let minDistance = Infinity;

  bars.forEach(bar => {
    const dist = getDistance(userLocation.lat, userLocation.lng, bar.lat, bar.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = bar;
    }
  });

  return nearest;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
