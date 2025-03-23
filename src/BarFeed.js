import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

function getInitials(name) {
  if (!name) return "👤";
  const parts = name.trim().split(" ");
  const initials = parts.map((part) => part[0].toUpperCase()).slice(0, 2).join("");
  return initials;
}

const genderOptions = ["Woman", "Man", "Transgender", "Non-binary/non-conforming", "Prefer not to respond"];
const sexualityOptions = [
  "Asexual",
  "Bisexual",
  "Gay",
  "Heterosexual (straight)",
  "Lesbian",
  "Pansexual",
  "Queer",
  "Questioning",
  "Prefer not to specify"
];

function BarFeed() {
  const { barName } = useParams();
  const [checkIns, setCheckIns] = useState([]);
  const [filters, setFilters] = useState({
    gender: "",
    sexuality: "",
    college: "",
    openToChat: false
  });
  const [otherHotBars, setOtherHotBars] = useState([]);

  const viewer = JSON.parse(localStorage.getItem("viewerInfo") || "{}");

  useEffect(() => {
    const q = query(
      collection(db, "checkins"),
      where("bar", "==", barName),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCheckIns(data);
    });

    return () => unsubscribe();
  }, [barName]);

  useEffect(() => {
    const fetchOtherHotBars = async () => {
      const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
      const q = query(collection(db, "checkins"), where("timestamp", ">=", oneHourAgo));

      onSnapshot(q, (snapshot) => {
        const counts = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const bar = data.bar;
          const city = data.city;
          if (bar && city && data.bar !== barName && checkIns[0]?.city === city) {
            counts[bar] = (counts[bar] || 0) + 1;
          }
        });

        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([bar, count]) => ({ bar, count }));

        setOtherHotBars(sorted);
      });
    };

    fetchOtherHotBars();
  }, [barName, checkIns]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const visibleCheckIns = checkIns.filter((user) => {
    return (
      (!filters.gender || user.gender === filters.gender) &&
      (!filters.sexuality || user.sexuality === filters.sexuality) &&
      (!filters.college || user.college === filters.college) &&
      (!filters.openToChat || user.openToChat)
    );
  });

  const uniqueColleges = Array.from(new Set(checkIns.map((u) => u.college).filter(Boolean)));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4 text-center">Who's at {barName}?</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="gender"
            value={filters.gender}
            onChange={handleFilterChange}
            className="border p-2 rounded w-full"
          >
            <option value="">All Genders</option>
            {genderOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            name="sexuality"
            value={filters.sexuality}
            onChange={handleFilterChange}
            className="border p-2 rounded w-full"
          >
            <option value="">All Sexualities</option>
            {sexualityOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            name="college"
            value={filters.college}
            onChange={handleFilterChange}
            className="border p-2 rounded w-full"
          >
            <option value="">All Colleges</option>
            {uniqueColleges.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="openToChat"
            checked={filters.openToChat}
            onChange={handleFilterChange}
          />
          <span>Only show people open to chat</span>
        </label>
      </div>

      {/* Feed */}
      {visibleCheckIns.length === 0 ? (
        <p className="text-center text-gray-500">No one matches your filters.</p>
      ) : (
        <div className="grid gap-4">
          {visibleCheckIns.map((user) => {
            const isSameCollege = viewer.college && user.college === viewer.college;
            const isSameHometown = viewer.hometown && user.hometown === viewer.hometown;

            return (
              <div key={user.id} className="bg-white shadow rounded-2xl p-4 border flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold">
                      {user.name || "Anonymous"}, {user.age}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {user.timestamp?.toDate?.().toLocaleTimeString?.([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{user.college}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.gender} {user.gender && user.sexuality ? "|" : ""} {user.sexuality}
                  </p>
                  <div className="mt-2 space-y-1">
                    {user.openToChat && (
                      <p className="inline-block text-sm font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        👋 Open to Chat
                      </p>
                    )}
                    {isSameCollege && (
                      <p className="inline-block text-sm font-medium bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        🎓 Same College
                      </p>
                    )}
                    {isSameHometown && (
                      <p className="inline-block text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        🏡 Same Hometown
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other Hot Bars */}
      {otherHotBars.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-2">🔥 Other Hot Bars in {checkIns[0]?.city}</h3>
          <ul className="text-sm space-y-1">
            {otherHotBars.map(({ bar, count }) => (
              <li key={bar}>
                • {bar} ({count} {count === 1 ? "person" : "people"})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BarFeed;
