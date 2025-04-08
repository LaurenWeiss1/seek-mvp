import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { getDatabase, ref, onChildAdded, push, set, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from 'uuid';

const funEmojis = ["🐸", "🦊", "🐼", "🐯", "🦄", "🐵", "🐙", "🐶", "🐱", "🐻", "🐧"];

function ChatRoom() {
  const [userLocation, setUserLocation] = useState(null);
  const [barNearby, setBarNearby] = useState(null);
  const [bars, setBars] = useState([]);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userEmoji, setUserEmoji] = useState(localStorage.getItem("seek-user-emoji") || "");
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);

  const db = getDatabase();
  const auth = getAuth();

  const barSheet =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv";

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  useEffect(() => {
    Papa.parse(barSheet, {
      download: true,
      header: true,
      complete: (results) => {
        const cleanBars = results.data
          .map((row) => ({
            name: row.bar?.trim(),
            city: row.city?.trim(),
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
          }))
          .filter((b) => b.name && b.latitude && b.longitude);
        setBars(cleanBars);
      },
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      },
      (err) => {
        console.error("Location error", err);
        setError("Location permission is required to use this feature.");
      }
    );
  }, []);

  useEffect(() => {
    if (userLocation && bars.length > 0) {
      const match = bars.find((bar) => {
        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          bar.latitude,
          bar.longitude
        );
        return distance <= 50;
      });

      if (match) setBarNearby(match);
    }
  }, [userLocation, bars]);

  useEffect(() => {
    if (!barNearby) return;
    const messagesRef = ref(db, `chats/${barNearby.name}`);
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      msg.id = snapshot.key;
      setMessages((prev) => [...prev, msg]);
    });
    return () => unsubscribe();
  }, [barNearby]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const user = auth.currentUser;
    const messageRef = push(ref(db, `chats/${barNearby.name}`));
    await set(messageRef, {
      uid: user?.uid || "anon",
      text: newMessage,
      timestamp: Date.now(),
      emoji: userEmoji,
      votes: 0,
      downvotes: 0,
      replies: [],
      parentId: replyingTo || null,
    });
    setNewMessage("");
    setReplyingTo(null);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEmojiSelect = (emoji) => {
    setUserEmoji(emoji);
    localStorage.setItem("seek-user-emoji", emoji);
  };

  const handleUpvote = async (msgId) => {
    const voted = localStorage.getItem(`voted-${msgId}`);
    if (voted) return;
    const msgRef = ref(db, `chats/${barNearby.name}/${msgId}`);
    const updatedMsg = messages.find((m) => m.id === msgId);
    if (!updatedMsg) return;
    await update(msgRef, { votes: updatedMsg.votes + 1 });
    localStorage.setItem(`voted-${msgId}`, "true");
  };

  const handleDownvote = async (msgId) => {
    const voted = localStorage.getItem(`voted-down-${msgId}`);
    if (voted) return;
    const msgRef = ref(db, `chats/${barNearby.name}/${msgId}`);
    const updatedMsg = messages.find((m) => m.id === msgId);
    if (!updatedMsg) return;
    await update(msgRef, { downvotes: (updatedMsg.downvotes || 0) + 1 });
    localStorage.setItem(`voted-down-${msgId}`, "true");
  };

  const rootMessages = messages.filter((m) => !m.parentId);
  const repliesFor = (id) => messages.filter((m) => m.parentId === id);

  return (
    <div className="text-white px-4 pt-24 pb-6 min-h-screen bg-black flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-6">💬 Anonymous Bar Chat</h1>

      {!userEmoji && (
        <div className="mb-6 text-center">
          <p className="mb-2 text-lg">Choose your emoji identity:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {funEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-3xl hover:scale-110 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-center">{error}</p>}
      {!userLocation && !error && <p className="text-center">📍 Getting your location...</p>}

      {userLocation && !barNearby && (
        <div className="text-center">
          <p className="mb-2">🛑 You're not currently at a supported bar location.</p>
          <p className="text-sm text-gray-400">
            Your location:<br />
            lat: {userLocation.latitude.toFixed(5)}, long: {userLocation.longitude.toFixed(5)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Known bars loaded: {bars.length}</p>
        </div>
      )}

      {barNearby && userEmoji && (
        <div className="flex flex-col flex-1">
          <p className="text-green-400 text-center mb-4 text-sm">
            ✅ You're at {barNearby.name} in {barNearby.city}
          </p>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 bg-black">
            {rootMessages.map((msg) => (
              <div key={msg.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold">{msg.emoji}</div>
                  <div className="text-xs text-gray-400">{formatTime(msg.timestamp)}</div>
                </div>
                <div className="mt-2 text-white text-sm">{msg.text}</div>
                <div className="flex items-center gap-4 mt-3 text-sm text-pink-400">
                  <button onClick={() => handleUpvote(msg.id)} className="hover:underline">
                    ⬆️ {msg.votes || 0}
                  </button>
                  <button onClick={() => handleDownvote(msg.id)} className="hover:underline">
                    ⬇️ {msg.downvotes || 0}
                  </button>
                  <button onClick={() => setReplyingTo(msg.id)} className="hover:underline">
                    💬 Reply
                  </button>
                </div>

                {repliesFor(msg.id).map((reply) => (
                  <div key={reply.id} className="ml-6 mt-3 border-l border-gray-700 pl-3">
                    <div className="text-sm text-white">{reply.emoji} {reply.text}</div>
                    <div className="text-xs text-gray-400">{formatTime(reply.timestamp)}</div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 items-center mt-4">
            <input
              className="flex-1 p-3 rounded-full bg-gray-800 text-white focus:outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? "Replying..." : "Type a message..."}
            />
            <button onClick={handleSend} className="bg-pink-600 px-5 py-3 rounded-full font-semibold">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoom;
