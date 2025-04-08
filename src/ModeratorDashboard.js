import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const ADMIN_EMAILS = ["you@example.com", "teammate@example.com"]; // ✅ Add your authorized emails here

function ModeratorDashboard() {
  const [events, setEvents] = useState([]);
  const [promos, setPromos] = useState([]);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const eventSnap = await getDocs(collection(db, "events"));
      setEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const promoSnap = await getDocs(collection(db, "promos"));
      setPromos(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, []);

  const handleApprove = async (type, id) => {
    await updateDoc(doc(db, type, id), { approved: true });
    alert("Approved!");
    window.location.reload();
  };

  const handleDelete = async (type, id) => {
    await deleteDoc(doc(db, type, id));
    alert("Deleted!");
    window.location.reload();
  };

  if (!user) {
    return <p className="text-center text-white pt-20">Please sign in to continue.</p>;
  }

  if (!isAdmin) {
    return <p className="text-center text-white pt-20">⛔ You do not have permission to view this page.</p>;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">🛠️ Moderator Dashboard</h2>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold mb-4">Pending Events</h3>
        {events.filter(e => !e.approved).length === 0 ? (
          <p className="text-gray-400">No pending events.</p>
        ) : (
          events.filter(e => !e.approved).map(e => (
            <div key={e.id} className="bg-white text-black rounded-xl p-4 mb-4 shadow">
              <h4 className="font-bold text-lg">{e.title}</h4>
              <p>{e.description}</p>
              <p className="text-sm text-gray-600">Bar: {e.barName} • City: {e.city}</p>
              <div className="mt-3 flex gap-3">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded"
                  onClick={() => handleApprove("events", e.id)}
                >
                  Approve
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded"
                  onClick={() => handleDelete("events", e.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4">Pending Promos</h3>
        {promos.filter(p => !p.approved).length === 0 ? (
          <p className="text-gray-400">No pending promos.</p>
        ) : (
          promos.filter(p => !p.approved).map(p => (
            <div key={p.id} className="bg-white text-black rounded-xl p-4 mb-4 shadow">
              <h4 className="font-bold text-lg">{p.title}</h4>
              <p>{p.description}</p>
              <p className="text-sm text-gray-600">Bar: {p.barName} • City: {p.city}</p>
              <div className="mt-3 flex gap-3">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded"
                  onClick={() => handleApprove("promos", p.id)}
                >
                  Approve
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded"
                  onClick={() => handleDelete("promos", p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default ModeratorDashboard;
