// Updated MapView.js with Heatmap, Filters, Legend, Filter Badges, and Marker Popups
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const cityOptions = {
  Berkeley: [37.8715, -122.273],
  "San Francisco": [37.7749, -122.4194],
  "New York": [40.7128, -74.006],
  "Los Angeles": [34.0522, -118.2437],
};

function HeatmapLayer({ heatmapPoints }) {
  const map = useMap();

  useEffect(() => {
    const heat = L.heatLayer(heatmapPoints, { radius: 25, blur: 15 });
    heat.addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [heatmapPoints, map]);

  return null;
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapView() {
  const [selectedCity, setSelectedCity] = useState("Berkeley");
  const [allCheckins, setAllCheckins] = useState([]);
  const [genderFilter, setGenderFilter] = useState("");
  const [sexualityFilter, setSexualityFilter] = useState("");
  const [openToChatFilter, setOpenToChatFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const sheetUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv";

    Papa.parse(sheetUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const checkins = results.data
          .filter((row) => row.city === selectedCity && row.latitude && row.longitude)
          .map((row) => ({
            lat: parseFloat(row.latitude),
            lng: parseFloat(row.longitude),
            gender: row.gender,
            sexuality: row.sexuality,
            openToChat: row.openToChat === "true",
            bar: row.bar,
            timestamp: row.timestamp,
          }));
        setAllCheckins(checkins);
        setIsLoading(false);
      },
    });
  }, [selectedCity]);

  const filteredCheckins = allCheckins.filter((checkin) => {
    return (
      (!genderFilter || checkin.gender === genderFilter) &&
      (!sexualityFilter || checkin.sexuality === sexualityFilter) &&
      (!openToChatFilter || checkin.openToChat)
    );
  });

  const filteredPoints = filteredCheckins.map((checkin) => [checkin.lat, checkin.lng]);

  const activeFilters = [
    genderFilter && `Gender: ${genderFilter}`,
    sexualityFilter && `Sexuality: ${sexualityFilter}`,
    openToChatFilter && "Open to Chat ✅",
  ].filter(Boolean);

  const getBarStats = (barName) => {
    const barCheckins = filteredCheckins.filter((c) => c.bar === barName);
    const total = barCheckins.length;
    const maleCount = barCheckins.filter((c) => c.gender === "Man").length;
    const femaleCount = barCheckins.filter((c) => c.gender === "Woman").length;
    const malePercent = total ? Math.round((maleCount / total) * 100) : 0;
    const femalePercent = total ? Math.round((femaleCount / total) * 100) : 0;
    return { total, malePercent, femalePercent };
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">🔥 Hot Bars Map</h2>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="border p-2 rounded w-full"
        >
          {Object.keys(cityOptions).map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">All Genders</option>
          <option value="Man">Man</option>
          <option value="Woman">Woman</option>
          <option value="Transgender">Transgender</option>
          <option value="Non-binary/non-conforming">Non-binary/non-conforming</option>
          <option value="Prefer not to respond">Prefer not to respond</option>
        </select>

        <select
          value={sexualityFilter}
          onChange={(e) => setSexualityFilter(e.target.value)}
          className="border p-2 rounded w-full"
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

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={openToChatFilter}
            onChange={(e) => setOpenToChatFilter(e.target.checked)}
          />
          Open to chat 👋
        </label>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter, idx) => (
            <span
              key={idx}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              {filter}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-500">Loading map data...</div>
      ) : (
        <div className="relative">
          <MapContainer
            center={cityOptions[selectedCity]}
            zoom={15}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer heatmapPoints={filteredPoints} />

            {filteredCheckins.map((checkin, index) => {
              const { total, malePercent, femalePercent } = getBarStats(checkin.bar);
              return (
                <Marker
                  key={index}
                  position={[checkin.lat, checkin.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <strong>{checkin.bar}</strong><br />
                    {total} {total === 1 ? "person" : "people"} here<br />
                    {malePercent}% male / {femalePercent}% female
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-2 right-2 bg-white text-sm text-gray-700 px-3 py-1 rounded shadow">
            <strong>Legend:</strong> More 🔥 = More people checked in
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
