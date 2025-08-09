import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const profanityList = ['badword1', 'badword2']; // Add more filters as needed

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [userEmoji, setUserEmoji] = useState(localStorage.getItem('seek-user-emoji') || '');
  const [city, setCity] = useState('');
  const [bar, setBar] = useState('');
  const [chatMode, setChatMode] = useState('city'); // 'city' or 'bar'
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const collectionPath =
    chatMode === 'bar'
      ? bar ? `chatrooms/bar-${bar}` : null
      : city ? `chatrooms/city-${city}` : null;

  // Handle changes for city and bar data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setCity(data?.lastCheckIn?.city || '');
          setBar(data?.lastCheckIn?.bar || '');
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch messages based on the current collection path
  useEffect(() => {
    if (!collectionPath) return; // Don't run if path is invalid

    const q = query(collection(db, collectionPath, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, [collectionPath]);

  // Filter profanity from messages
  const filterMessage = (text) => {
    return profanityList.reduce(
      (acc, bad) => acc.replace(new RegExp(bad, 'gi'), '****'),
      text
    );
  };

  // Send a new message
  const sendMessage = async () => {
    if (!message.trim()) return;
    const cleanText = filterMessage(message);
    await addDoc(collection(db, collectionPath, 'messages'), {
      emoji: userEmoji,
      text: cleanText,
      bar,
      timestamp: serverTimestamp()
    });
    setMessage('');
  };

  // Handle mode change with validation
  const handleChatModeChange = (mode) => {
    if (mode === 'bar' && !bar) {
      setShowCheckInModal(true); // Prompt to check-in if no bar is selected
    } else if (mode === 'city' && !city) {
      alert('Please select a city first.'); // Prompt to select city
    } else {
      setChatMode(mode);
    }
  };

  // Reset bar when city changes
  const handleCityChange = (newCity) => {
    setCity(newCity);
    setBar(''); // Reset the bar when the city changes
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Chat content */}
      <div className="relative z-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-center">
          Chat in {chatMode === 'bar' ? bar : city}
        </h1>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-4 gap-2">
          <button
            onClick={() => handleChatModeChange('city')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              chatMode === 'city'
                ? 'bg-[#A1C5E6] text-black'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            Chat in {city || 'City'}
          </button>
          <button
            onClick={() => handleChatModeChange('bar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              chatMode === 'bar'
                ? 'bg-[#A1C5E6] text-black'
                : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            Chat in {bar || 'Bar'}
          </button>
        </div>

        {/* Display messages */}
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
              {msg.bar && (
                <span className="text-xs text-gray-400 ml-2">@{msg.bar}</span>
              )}
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="flex items-center gap-3">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Say something..."
            className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={false}
          />
          <button
            onClick={sendMessage}
            className="bg-[#A1C5E6] text-black font-semibold px-5 py-3 rounded-xl disabled:opacity-50 hover:scale-105 transition"
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* Check-In Modal */}
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
                  window.location.href = "/"; // or "/city" if that fits your check-in flow
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
