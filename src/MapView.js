import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function MapView() {
  const [selectedCity, setSelectedCity] = useState("Berkeley");
  const [bars, setBars] = useState([]);
  const [checkinCounts, setCheckinCounts] = useState({});
  const [genderFilter, setGenderFilter] = useState("");
  const [sexualityFilter, setSexualityFilter] = useState("");
  const [openToChatFilter, setOpenToChatFilter] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
      let q = query(
        collection(db, "checkins"),
        where("city", "==", selectedCity),
        where("timestamp", ">=", oneHourAgo)
      );
      const snapshot = await getDocs(q);
      const counts = {};
      const openToChatStats = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const matchGender = genderFilter ? data.gender === genderFilter : true;
        const matchSexuality = sexualityFilter ? data.sexuality === sexualityFilter : true;
        const matchOpenToChat = openToChatFilter ? data.openToChat === true : true;

        if (matchGender && matchSexuality && matchOpenToChat) {
          const bar = data.bar;
          if (bar) {
            counts[bar] = (counts[bar] || 0) + 1;
            openToChatStats[bar] = openToChatStats[bar] || { total: 0, open: 0 };
            openToChatStats[bar].total++;
            if (data.openToChat) openToChatStats[bar].open++;
          }
        }
      });

      const popupCounts = {};
      for (const bar in counts) {
        const { total, open } = openToChatStats[bar] || { total: 0, open: 0 };
        const openPercent = total ? Math.round((open / total) * 100) : 0;
        popupCounts[bar] = `${counts[bar]} ${counts[bar] === 1 ? "person" : "people"} here | ${openPercent}% open to chat`;
      }

      setCheckinCounts(popupCounts);
      setLoading(false);
    };

    fetchCheckins();
  }, [selectedCity, genderFilter, sexualityFilter, openToChatFilter]);

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">🗺️ Hot Bars Map</h2>

      <div className="mb-4 bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 sm:items-center sm:justify-between">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          {Object.keys(cityOptions).map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          <option value="">All Genders</option>
          <option value="Man">Man</option>
          <option value="Woman">Woman</option>
          <option value="Transgender">Transgender</option>
          <option value="Non-binary/non-conforming">Non-binary</option>
        </select>

        <select
          value={sexualityFilter}
          onChange={(e) => setSexualityFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          <option value="">All Sexualities</option>
          <option value="Heterosexual (straight)">Heterosexual (straight)</option>
          <option value="Gay">Gay</option>
          <option value="Lesbian">Lesbian</option>
          <option value="Bisexual">Bisexual</option>
          <option value="Queer">Queer</option>
          <option value="Asexual">Asexual</option>
          <option value="Pansexual">Pansexual</option>
          <option value="Questioning">Questioning</option>
          <option value="Prefer not to specify">Prefer not to specify</option>
        </select>

        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={openToChatFilter}
            onChange={(e) => setOpenToChatFilter(e.target.checked)}
            className="mr-2"
          />
          Open to Chat
        </label>
      </div>

      {loading && <p className="text-center text-gray-500 mb-4">Loading activity...</p>}

      <div className="h-[400px] sm:h-[500px] w-full rounded-xl overflow-hidden">
        <MapContainer
          center={cityOptions[selectedCity]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <MapUpdater center={cityOptions[selectedCity]} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bars.map((bar, index) => (
            bar.latitude && bar.longitude && (
              <Marker
                key={index}
                position={[bar.latitude, bar.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <strong>{bar.name}</strong>
                  <br />
                  {checkinCounts[bar.name] || "No activity yet"}
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
