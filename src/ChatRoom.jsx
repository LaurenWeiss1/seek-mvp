import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { useLocation } from 'react-router-dom';

const profanityList = ['badword1', 'badword2']; // extend as needed

const ChatRoom = () => {
  const location = useLocation();

  // DM mode (explicit room)
  const routeRoomId =
    location.state?.roomId || new URLSearchParams(location.search).get('roomId') || null;

  // Forced group modes from navigation
  const routeBar = location.state?.bar || null;
  const routeCity = location.state?.city || null;
  const forceBar = !!location.state?.forceBar;
  const forceCity = !!location.state?.forceCity;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userEmoji, setUserEmoji] = useState(localStorage.getItem('seek-user-emoji') || '🙂');
  const [city, setCity] = useState(routeCity || localStorage.getItem('selectedCity') || '');
  const [bar, setBar] = useState(routeBar || localStorage.getItem('lastCheckInBar') || '');
  const [chatMode, setChatMode] = useState(
    routeRoomId ? 'dm' : forceBar ? 'bar' : forceCity ? 'city' : 'city'
  ); // 'dm' | 'bar' | 'city'
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Ensure signed in + hydrate last check-in data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try { await signInAnonymously(auth); } catch {}
      }
      const current = auth.currentUser;
      if (current) {
        const snap = await getDoc(doc(db, 'users', current.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (!routeCity && data?.lastCheckIn?.city) setCity(data.lastCheckIn.city);
          if (!routeBar && data?.lastCheckIn?.bar) setBar(data.lastCheckIn.bar);
        }
      }
    });
    return () => unsub();
  }, [routeBar, routeCity]);

  // Which Firestore path to use
  const collectionPath = useMemo(() => {
    if (routeRoomId || chatMode === 'dm') {
      return routeRoomId ? `dmRooms/${routeRoomId}` : null;
    }
    if (chatMode === 'bar') {
      return bar ? `chatrooms/bar-${bar}` : null;
    }
    // default city
    return city ? `chatrooms/city-${city}` : null;
  }, [routeRoomId, chatMode, city, bar]);

  // Subscribe to messages
  useEffect(() => {
    if (!collectionPath) return;
    const q = query(collection(db, collectionPath, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, [collectionPath]);

  const filterMessage = (text) =>
    profanityList.reduce((acc, bad) => acc.replace(new RegExp(bad, 'gi'), '****'), text);

  const sendMessage = async () => {
    if (!message.trim() || !collectionPath) return;
    const cleanText = filterMessage(message);
    await addDoc(collection(db, collectionPath, 'messages'), {
      emoji: userEmoji,
      text: cleanText,
      bar, // harmless in city rooms; hidden in DM header
      from: auth.currentUser?.uid || null,
      timestamp: serverTimestamp(),
    });
    setMessage('');
  };

  const handleChatModeChange = (mode) => {
    if (routeRoomId) return; // DM locked
    if (mode === 'bar' && !bar) {
      setShowCheckInModal(true);
    } else if (mode === 'city' && !city) {
      alert('Please select a city first.');
    } else {
      setChatMode(mode);
    }
  };

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-center">
          {routeRoomId
            ? 'Private Chat'
            : chatMode === 'bar'
            ? `Chat in ${bar || 'Bar'}`
            : `Chat in ${city || 'City'}`}
        </h1>

        {/* Mode toggle (hide in DM) */}
        {!routeRoomId && (
          <div className="flex justify-center mb-4 gap-2">
            <button
              onClick={() => handleChatModeChange('city')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                chatMode === 'city'
                  ? 'bg-[#A1C5E6] text-black'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              City Chat
            </button>
            <button
              onClick={() => handleChatModeChange('bar')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                chatMode === 'bar'
                  ? 'bg-[#A1C5E6] text-black'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              Bar Chat
            </button>
          </div>
        )}

        {routeRoomId && (
          <p className="text-center text-sm text-gray-300 mb-3">
            You’re in an anonymous 1-on-1 room. Be kind.
          </p>
        )}

        {/* Messages */}
        <div className="space-y-3 mb-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-xl p-3 shadow border border-gray-700 text-white"
            >
              <span className="text-xs text-gray-400">
                [{new Date(msg.timestamp?.toDate?.() || '').toLocaleTimeString()}]
              </span>{" "}
              {msg.emoji} {msg.text}
              {!routeRoomId && msg.bar && (
                <span className="text-xs text-gray-400 ml-2">@{msg.bar}</span>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={routeRoomId ? "Send a private (anonymous) message..." : "Say something..."}
            className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!collectionPath}
          />
          <button
            onClick={sendMessage}
            className="bg-[#A1C5E6] text-black font-semibold px-5 py-3 rounded-xl disabled:opacity-50 hover:scale-105 transition"
            disabled={!message.trim() || !collectionPath}
          >
            Send
          </button>
        </div>
      </div>

      {/* Check-In Modal for bar chat */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#0b0d12] border border-white/20 rounded-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Not checked into a bar</h2>
            <p className="text-gray-300 mb-6">
              You’re not currently checked into a bar. Would you like to check in now?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  window.location.href = "/checkin-landing";
                }}
                className="bg-[#A1C5E6] text-black px-4 py-2 rounded-lg font-semibold hover:scale-105 transition"
              >
                Go to Check-In
              </button>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
