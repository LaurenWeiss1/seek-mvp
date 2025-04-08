import { useState } from "react";
import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

import CheckInLanding from "./CheckInLanding";
import CheckIn from "./CheckIn";
import BarFeed from "./BarFeed";
import HotTonight from "./HotTonight";
import BulkBarUploader from "./BulkBarUploader";
import InstallPrompt from "./components/InstallPrompt";
import ChatRoom from "./ChatRoom";
import ProfileForm from "./components/ProfileForm"; // 🔁 used instead of modal
import ProfileAuth from "./ProfileAuth";
import Modal from "./components/Modal";
import AuthForm from "./components/AuthForm";
import TestSeed from './TestSeed';
import logo from "./seek-logo.svg";

signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch(error => console.error("Anonymous sign-in error:", error));

function BottomNav() {
  const location = useLocation();
  const [user] = useAuthState(auth);

  const getInitials = (name) => {
    if (!name) return "👤";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  const navItems = [
    { to: "/checkin", label: "✅" },
    { to: "/hot", label: "🔥" },
    { to: "/chat", label: "💬" },
    { to: "/bar/AllBars", label: "🧭" },
    { to: "/profile", label: user?.displayName || getInitials(user?.email || "") || "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-inner z-50 flex justify-around items-center h-14 text-xl">
      {navItems.map(item => (
        <Link
          key={item.to}
          to={item.to}
          className={`${location.pathname === item.to ? "text-blue-600" : "text-gray-500"} hover:text-black`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [user] = useAuthState(auth);

  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Top left logo */}
        <div className="fixed top-0 left-0 z-40 flex items-center px-4 py-2 bg-white shadow-md">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Seek Logo" className="h-7 w-7 object-contain" />
            <span className="font-semibold text-lg text-gray-800">Seek</span>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto pt-14 pb-16">
          <Routes>
            <Route path="/" element={<CheckInLanding />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/bar/:barName" element={<BarFeed />} />
            <Route path="/hot" element={<HotTonight />} />
            <Route path="/admin" element={<BulkBarUploader />} />
            <Route path="/chat" element={<ChatRoom />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/test-seed" element={<TestSeed />} />
            <Route path="/admin-seed" element={<TestSeed />} />

          </Routes>
        </main>

        <BottomNav />
        <InstallPrompt />

        <Modal isOpen={authOpen} onClose={() => setAuthOpen(false)}>
          <AuthForm onSignedUp={() => {
            setAuthOpen(false);
          }} />
        </Modal>
      </div>
    </Router>
  );
}

export default App;
