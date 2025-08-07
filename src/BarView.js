import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const BarView = () => {
  const { barName } = useParams();
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  const isValidBar =
    typeof barName === 'string' &&
    barName.trim() !== '' &&
    barName !== 'none';

  // 🔒 Scroll lock if barName === 'none'
  useEffect(() => {
    if (barName === 'none') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [barName]);

  // 👂 Firestore query (only if valid)
  useEffect(() => {
    if (!isValidBar) {
      setCheckIns([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'checkins'),
      where('bar', '==', barName),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setCheckIns(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [barName, isValidBar]);

  if (typeof barName === 'undefined') {
    return null;
  }

if (!isValidBar) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black text-white text-center px-4 overflow-hidden">
      <h2 className="text-xl font-bold mb-6">
        You're not currently checked into a bar.
      </h2>
      <button
        onClick={() => navigate('/checkin')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition"
      >
        Check in now
      </button>
    </div>
  );
}


  // ⏳ Loading real bar check-ins
  if (loading) {
    return <p className="text-center mt-4">Loading check-ins...</p>;
  }

  // ✅ Checked into a bar
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Check-ins at {barName}</h2>
      {checkIns.length === 0 ? (
        <p>No one is checked in here yet.</p>
      ) : (
        <ul className="space-y-2">
          {checkIns.map((checkIn, index) => (
            <li key={index} className="border p-2 rounded">
              <p>{checkIn.name}, {checkIn.age}</p>
              <p>{checkIn.college} • {checkIn.hometown}</p>
              <p className="text-sm text-gray-500">
                {checkIn.timestamp?.toDate
                  ? new Date(checkIn.timestamp.toDate()).toLocaleTimeString()
                  : 'Unknown time'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BarView;
