import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return "";
  const now = new Date();
  const diffMs = now - timestamp.toDate();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  return `${diffMins} minutes ago`;
}

function BarFeed() {
  const { barName } = useParams();
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    const q = query(
      collection(db, "checkins"),
      where("bar", "==", barName),
      where("timestamp", ">=", oneHourAgo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCheckins(data);
    });

    return () => unsubscribe();
  }, [barName]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">👥 People at {barName}</h2>

      {checkins.length === 0 ? (
        <p className="text-center text-gray-500">
          No one here yet. Be the first to check in!
        </p>
      ) : (
        <ul className="grid gap-4">
          {checkins.map((person, idx) => (
            <li
              key={person.id || idx}
              className="bg-white border rounded-2xl p-5 shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">
                  {person.name || "Someone"}{person.age ? `, ${person.age}` : ""}
                </h3>
                {person.openToChat && (
                  <span className="text-sm text-green-600 font-medium">👋 Open to Chat</span>
                )}
              </div>

              <div className="text-sm text-gray-700 mb-1">
                {person.gender} • {person.sexuality}
              </div>

              <div className="text-sm text-gray-600">
                From {person.hometown}, {person.homeState} ({person.homeCountry})
              </div>

              {person.college && (
                <div className="text-sm italic text-gray-500">
                  Goes to {person.college}
                </div>
              )}

              {person.timestamp && (
                <div className="text-xs text-gray-400 mt-2">
                  Checked in {timeAgo(person.timestamp)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BarFeed;
