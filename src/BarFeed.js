import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

function BarFeed() {
  const { barName } = useParams();
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    // 🚫 Don't run query if barName is missing, invalid, or 'none'
    if (
      !barName ||
      barName === "none" ||
      typeof barName !== "string" ||
      barName.trim() === ""
    ) {
      console.log("⛔️ Skipping Firestore query due to invalid barName:", barName);
      return;
    }

    const q = query(collection(db, "checkins"), where("bar", "==", barName));
    const unsub = onSnapshot(q, (snap) => {
      setCheckins(snap.docs.map((doc) => doc.data()));
    });

    return () => unsub();
  }, [barName]);

  // Handle the "not at a bar" case
  if (
    !barName ||
    barName === "none" ||
    typeof barName !== "string" ||
    barName.trim() === ""
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black/80">
        <h1 className="text-3xl font-bold mb-6">
          You're not currently checked into a bar.
        </h1>
        <button
          className="bg-[#A1C5E6] text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-[#90B8DE] transition"
          onClick={() => navigate("/checkin-landing")}
        >
          Check-in now
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen p-6 text-white"
      style={{
        backgroundColor: "#0b0d12",
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Page content */}
      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold text-center mb-8">
          People at {barName}
        </h1>

        {checkins.length === 0 ? (
          <p className="text-center text-gray-300">
            No one here yet. Be the first to check in!
          </p>
        ) : (
          <ul className="space-y-5">
            {checkins.map((ci, i) => (
              <li
                key={i}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-700 text-white"
              >
                <h2 className="text-lg font-bold">{ci.name}</h2>
                <p className="text-gray-300 text-sm">
                  {ci.age} | {ci.gender} | {ci.sexuality}
                </p>
                <p className="text-gray-300 text-sm">
                  {ci.homeCity ? `${ci.homeCity}, ` : ""}
                  {ci.homeState || ci.homeCountry}
                </p>
                {ci.college && (
                  <p className="text-gray-300 text-sm mt-1">{ci.college}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default BarFeed;
