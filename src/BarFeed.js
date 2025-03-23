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
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">👥 People at {barName}</h2>

      {checkins.length === 0 ? (
        <p className="text-center text-gray-500">
          No one here yet. Be the first to check in!
        </p>
      ) : (
        <ul className="space-y-4">
          {checkins.map((person, idx) => (
            <li key={person.id || idx} className="border p-4 rounded shadow-sm bg-white">
              <div className="font-semibold text-lg">
                {person.name || "Someone"}{person.age ? `, ${person.age}` : ""}
              </div>
              <div className="text-sm text-gray-600">
                {person.gender} • {person.sexuality}
              </div>
              <div className="text-sm">
                from {person.hometown}, {person.homeState} ({person.homeCountry})
              </div>
              <div className="text-sm italic text-gray-500">
                {person.college && `Goes to ${person.college}`}
              </div>
              {person.openToChat && (
                <div className="mt-2 text-green-600 font-medium">👋 Open to Chat</div>
              )}
              {person.timestamp && (
                <div className="text-xs text-gray-500 mt-1">
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
