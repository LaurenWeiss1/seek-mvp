import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  getDocs
} from "firebase/firestore";

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

function EventsPage() {
  const [selectedCity, setSelectedCity] = useState("Berkeley");
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const now = Timestamp.now();

      const eventQuery = query(
        collection(db, "events"),
        where("city", "==", selectedCity),
        where("timestamp", ">=", now),
        where("approved", "==", true)
      );
      const eventSnap = await getDocs(eventQuery);
      setEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const promoQuery = query(
        collection(db, "promos"),
        where("city", "==", selectedCity),
        where("approved", "==", true)
      );
      const promoSnap = await getDocs(promoQuery);
      setPromos(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white pt-20 pb-28 px-4">
      <h2 className="text-3xl font-bold text-center mb-6">🎉 Events & Promos</h2>

      <div className="mb-4 max-w-sm mx-auto">
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

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-full font-semibold ${activeTab === "events" ? "bg-white text-black" : "bg-gray-700 text-white"}`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab("promos")}
          className={`px-4 py-2 rounded-full font-semibold ${activeTab === "promos" ? "bg-white text-black" : "bg-gray-700 text-white"}`}
        >
          Promos
        </button>
      </div>

      {activeTab === "events" ? (
        events.length === 0 ? (
          <p className="text-center text-gray-300">No upcoming events in {selectedCity}.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white text-black p-4 rounded-2xl shadow">
                <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                <p className="text-sm text-gray-700 mb-1">{event.description}</p>
                <p className="text-xs text-gray-500">At {event.barName} • {new Date(event.timestamp.toDate()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        promos.length === 0 ? (
          <p className="text-center text-gray-300">No promos currently in {selectedCity}.</p>
        ) : (
          <div className="space-y-4">
            {promos.map((promo) => (
              <div key={promo.id} className="bg-white text-black p-4 rounded-2xl shadow">
                <h3 className="text-lg font-bold mb-1">{promo.title}</h3>
                <p className="text-sm text-gray-700 mb-1">{promo.description}</p>
                <p className="text-xs text-gray-500">At {promo.barName}</p>
              </div>
            ))}
          </div>
        )
      )}

      <div className="mt-10 text-center border-t border-gray-700 pt-6">
        <p className="text-gray-300 mb-2">📣 Are you a bar hosting an event or promo?</p>
        <Link
          to="/submit"
          className="inline-block bg-white text-black font-semibold px-4 py-2 rounded-full shadow hover:bg-gray-100"
        >
          Submit it here
        </Link>
      </div>
    </div>
  );
}

export default EventsPage;