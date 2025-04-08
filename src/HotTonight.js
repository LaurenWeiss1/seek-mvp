import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

function HotTonight() {
  const [hotBars, setHotBars] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Berkeley");

  useEffect(() => {
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

    const q = query(
      collection(db, "checkins"),
      where("timestamp", ">=", oneHourAgo),
      where("city", "==", selectedCity)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      const checkinDocs = snapshot.docs.map((doc) => doc.data());
      console.log("🔥 Raw check-ins for", selectedCity, ":", checkinDocs);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const bar = data.bar;
        if (counts[bar]) {
          counts[bar] += 1;
        } else {
          counts[bar] = 1;
        }
      });

      const sortedBars = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([bar, count]) => ({ bar, count }));

      setHotBars(sortedBars);
    });

    return () => unsubscribe();
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white pt-20 pb-24 px-4">
      <h2 className="text-3xl font-bold text-center mb-6">🔥 Hot Tonight</h2>

      <div className="mb-6 max-w-sm mx-auto">
        <label className="block font-semibold mb-2">Select a city:</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full border rounded px-3 py-2 text-black"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {hotBars.length === 0 ? (
        <p className="text-center text-gray-300">
          No activity yet in {selectedCity}. Check back soon or invite friends to check in!
        </p>
      ) : (
        <div className="space-y-4">
          {hotBars.map(({ bar, count }, idx) => (
            <Link
              key={bar}
              to={`/bar/${encodeURIComponent(bar)}`}
              className="block bg-white text-black p-4 rounded-2xl shadow hover:shadow-lg transition duration-200"
            >
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  {idx === 0 ? `🔥 ${idx + 1}. ${bar}` : `${idx + 1}. ${bar}`}
                </div>
                <div className="text-sm text-gray-700">
                  {count} {count === 1 ? "person" : "people"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default HotTonight;
