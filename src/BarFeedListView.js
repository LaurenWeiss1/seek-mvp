// BarFeedListView.js — shows a summary of all bars with check-ins
import { useEffect, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

function BarFeedListView() {
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    const unsubscribe = onSnapshot(collection(db, "checkins"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => doc.data())
        .filter((c) => c.timestamp?.seconds > oneHourAgo.seconds);
      setCheckins(data);
    });
    return () => unsubscribe();
  }, []);

  const grouped = checkins.reduce((acc, cur) => {
    const bar = cur.bar;
    if (!bar) return acc;
    acc[bar] = acc[bar] || [];
    acc[bar].push(cur);
    return acc;
  }, {});

  const getEmoji = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("pub")) return "🍺";
    if (t.includes("dive")) return "🥃";
    if (t.includes("club")) return "🪩";
    if (t.includes("karaoke")) return "🎤";
    if (t.includes("arcade")) return "🎮";
    if (t.includes("wine")) return "🍷";
    if (t.includes("gay")) return "🏳️‍🌈";
    if (t.includes("tiki")) return "🍹";
    if (t.includes("music")) return "🎶";
    return "🍻";
  };

  const barCards = Object.entries(grouped).map(([barName, people]) => {
    const ages = people.map(p => parseInt(p.age)).filter(Boolean);
    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : "N/A";
    const genderCounts = { Man: 0, Woman: 0, Other: 0 };
    people.forEach(p => {
      if (p.gender === "Man") genderCounts.Man++;
      else if (p.gender === "Woman") genderCounts.Woman++;
      else genderCounts.Other++;
    });

    const collegeMatch = people.find(p => p.college && p.college === user?.school);
    const barType = people.find(p => p.type)?.type || "Bar";

    return (
      <a key={barName} href={`/bar/${encodeURIComponent(barName)}`} className="block bg-white border rounded-xl p-4 mb-4 shadow hover:shadow-md">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-semibold">{getEmoji(barType)} {barName}</h2>
          <span className="text-sm text-gray-500">{barType}</span>
        </div>
        <div className="text-sm text-gray-700">👥 {people.length} people • Avg age: {avgAge}</div>
        <div className="text-sm text-gray-600">👨 {genderCounts.Man} / 👩 {genderCounts.Woman} / 🌈 {genderCounts.Other}</div>
        {collegeMatch && <div className="text-xs text-blue-600 mt-1">🎓 Someone from your school is here!</div>}
      </a>
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🔥 Bars with Activity</h1>
      {barCards.length === 0 ? (
        <p className="text-center text-gray-500">No check-ins in the last hour.</p>
      ) : (
        <div>{barCards}</div>
      )}
    </div>
  );
}

export default BarFeedListView;
