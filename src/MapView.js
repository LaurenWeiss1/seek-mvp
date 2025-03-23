import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const cityOptions = {
  Berkeley: [37.8715, -122.2730],
  "San Francisco": [37.7749, -122.4194],
  "New York": [40.7128, -74.006],
  "Los Angeles": [34.0522, -118.2437],
};

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapView() {
  const [selectedCity, setSelectedCity] = useState("Berkeley");
  const [bars, setBars] = useState([]);
  const [checkinCounts, setCheckinCounts] = useState({});

  useEffect(() => {
    const fetchBars = async () => {
      const q = query(
        collection(db, "bars"),
        where("city", "==", selectedCity)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => doc.data());
      setBars(data);
    };

    fetchBars();
  }, [selectedCity]);

  useEffect(() => {
    const fetchCheckins = async () => {
      const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
      const q = query(
        collection(db, "checkins"),
        where("city", "==", selectedCity),
        where("timestamp", ">=", oneHourAgo)
      );
      const snapshot = await getDocs(q);
      const counts = {};

      snapshot.forEach((doc) => {
        const bar = doc.data().bar;
        if (bar) {
          counts[bar] = (counts[bar] || 0) + 1;
        }
      });

      setCheckinCounts(counts);
    };

    fetchCheckins();
  }, [selectedCity]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">🗺️ Hot Bars Map</h2>

      <div className="mb-4 text-center">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="border p-2 rounded"
        >
          {Object.keys(cityOptions).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <MapContainer
        center={cityOptions[selectedCity]}
        zoom={15}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bars.map((bar, index) => {
          if (!bar.latitude || !bar.longitude) return null;

          return (
            <Marker
              key={index}
              position={[bar.latitude, bar.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <strong>{bar.name}</strong>
                <br />
                {checkinCounts[bar.name]
                  ? `${checkinCounts[bar.name]} ${
                      checkinCounts[bar.name] === 1 ? "person" : "people"
                    } here`
                  : "No activity yet"}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapView;
