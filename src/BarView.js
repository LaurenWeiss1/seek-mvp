import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebase';

const BarView = () => {
  const { barName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const displayBar = typeof barName === 'string' ? decodeURIComponent(barName) : '';
  const normalized = displayBar.toLowerCase().trim();
  const city = location.state?.city || localStorage.getItem('lastCheckInCity') || localStorage.getItem('selectedCity') || '';

  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  const isValidBar =
    typeof displayBar === 'string' && displayBar.trim() !== '' && displayBar !== 'none';

  const formatFrom = (ci) => {
    const homeCity = ci.homeCity?.trim();
    const homeState = ci.homeState?.trim();
    const homeCountry = ci.homeCountry?.trim();
    if (homeCity && homeState) return `${homeCity}, ${homeState}`;
    if (homeCity && homeCountry) return `${homeCity}, ${homeCountry}`;
    if (homeState && homeCountry) return `${homeState}, ${homeCountry}`;
    return homeCity || homeState || homeCountry || null;
  };

  useEffect(() => {
    if (displayBar === 'none') document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [displayBar]);

  useEffect(() => {
    if (!isValidBar) {
      setCheckIns([]);
      setLoading(false);
      return;
    }

    const qRef = query(
      collection(db, 'checkins'),
      where('normalizedBar', '==', normalized),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => d.data());
        // keep newest per person
        const seen = new Set();
        const unique = [];
        for (const ci of rows) {
          const anonKey = [
            ci.name?.trim()?.toLowerCase() || '',
            ci.college?.trim()?.toLowerCase() || '',
            ci.homeState?.trim()?.toLowerCase() || '',
            ci.homeCountry?.trim()?.toLowerCase() || ''
          ].join('|');
          const key = ci.uid || `anon:${anonKey}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(ci);
        }
        setCheckIns(unique);
        setLoading(false);
      },
      (err) => {
        console.error('BarView onSnapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isValidBar, normalized]);

  // Open a 1:1 anonymous DM
  const handleChatDM = async (ci) => {
    try {
      if (!ci?.uid) {
        alert("This person isn't available for private chat right now.");
        return;
      }
      if (!auth.currentUser) await signInAnonymously(auth);
      const me = auth.currentUser;
      if (!me) {
        alert('Could not sign you in to start chat. Try again.');
        return;
      }
      if (me.uid === ci.uid) {
        navigate('/chat');
        return;
      }
      const roomId = `dm_${[me.uid, ci.uid].sort().join('_')}`;
      const myName =
        JSON.parse(localStorage.getItem('checkinFormData') || '{}')?.name ||
        me.displayName || 'You';
      const theirName = ci.name || 'Someone';

      await setDoc(
        doc(db, 'dmRooms', roomId),
        {
          type: 'dm',
          participants: [me.uid, ci.uid],
          participantInfo: {
            [me.uid]: { name: myName },
            [ci.uid]: { name: theirName },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate('/chat', { state: { roomId, toUid: ci.uid, toName: theirName } });
    } catch (e) {
      console.error('handleChatDM error', e);
      alert('Could not open chat. Please try again.');
    }
  };

  if (typeof barName === 'undefined') return null;

  if (!isValidBar) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-center items-center text-white text-center px-4"
        style={{ backgroundColor: '#0b0d12' }}
      >
        <h2 className="text-xl font-bold mb-6">You're not currently checked into a bar.</h2>
        <button
          onClick={() => navigate('/checkin')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition"
        >
          Check in now
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen p-6 text-white"
      style={{
        backgroundColor: '#0b0d12',
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      <div className="relative z-10">
        {/* Header: Bar & City group chat buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h2 className="text-3xl font-extrabold">{displayBar}</h2>
          <div className="flex gap-2">
            {/* Bar group chat */}
            <button
              onClick={() =>
                navigate('/chat', { state: { forceBar: true, bar: displayBar } })
              }
              className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition"
              title={`Open bar group chat for ${displayBar}`}
            >
              💬 Bar Chat
            </button>
            {/* City group chat */}
            {city && (
              <button
                onClick={() =>
                  navigate('/chat', { state: { forceCity: true, city } })
                }
                className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition"
                title={`Open city group chat for ${city}`}
              >
                🌆 City Chat
              </button>
            )}
          </div>
        </div>

        {city ? <p className="text-gray-300 mb-6">in {city}</p> : null}

        {loading ? (
          <p className="text-center mt-4 text-gray-300">Loading check-ins...</p>
        ) : checkIns.length === 0 ? (
          <p className="text-gray-300">No one is checked in here yet.</p>
        ) : (
          <ul className="space-y-3">
            {checkIns.map((ci, index) => {
              const from = formatFrom(ci);
              const gender = ci.gender?.trim() || null;
              const sexuality = ci.sexuality?.trim() || null;
              const college = ci.college?.trim() || null;
              const myUid = auth.currentUser?.uid;

              return (
                <li key={index} className="border border-white/20 bg-white/10 p-4 rounded-xl">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {ci.name || 'Someone'}{ci.age ? `, ${ci.age}` : ''}
                      </p>
                      {college && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/15 border border-white/20">🎓 {college}</span>
                      )}
                      {from && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/15 border border-white/20">🏠 From {from}</span>
                      )}
                      {gender && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/15 border border-white/20">⚧ {gender}</span>
                      )}
                      {sexuality && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white/15 border border-white/20">❤️ {sexuality}</span>
                      )}
                    </div>

                    {/* 1:1 DM button */}
                    {ci.uid && ci.uid !== myUid && (
                      <button
                        onClick={() => handleChatDM(ci)}
                        className="px-3 py-1 rounded-lg bg-[#A1C5E6] text-black text-sm font-semibold hover:bg-[#90B8DE] transition"
                        title={`Chat with ${ci.name || 'this person'}`}
                      >
                        💬 Chat 1:1
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mt-2">
                    {ci.timestamp?.toDate
                      ? new Date(ci.timestamp.toDate()).toLocaleTimeString()
                      : 'Unknown time'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BarView;
