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
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4 text-center">🔥 Hot Tonight</h2>

      <div className="mb-4">
        <label className="block font-medium mb-1">Select a city:</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {hotBars.length === 0 ? (
        <p className="text-gray-500 text-center">
          No activity yet in {selectedCity}. Check back soon or invite friends to check in!
        </p>
      ) : (
        <ul className="divide-y border rounded overflow-hidden">
          {hotBars.map(({ bar, count }, idx) => (
            <li key={bar} className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link
                  to={`/bar/${encodeURIComponent(bar)}`}
                  className="font-medium text-blue-600 hover:underline"
                >
{idx === 0 ? `🔥 ${idx + 1}. ${bar}` : `${idx + 1}. ${bar}`}
</Link>
              </div>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {count} {count === 1 ? "person" : "people"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HotTonight;
