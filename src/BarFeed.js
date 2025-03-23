import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function BarFeed() {
  const { barName } = useParams();
  const [checkIns, setCheckIns] = useState([]);

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Who's at {barName}?</h2>

      {checkIns.length === 0 ? (
        <p className="text-center text-gray-500">No one has checked in yet.</p>
      ) : (
        <div className="grid gap-4">
          {checkIns.map((user) => (
            <div key={user.id} className="bg-white shadow rounded-2xl p-4 border">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold">
                  {user.name || "Anonymous"}, {user.age}
                </h3>
                <span className="text-xs text-gray-400">{user.timestamp?.toDate?.().toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-gray-700">{user.college}</p>
              <p className="text-xs text-gray-500 mt-1">
                {user.gender} {user.gender && user.sexuality ? "|" : ""} {user.sexuality}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BarFeed;
