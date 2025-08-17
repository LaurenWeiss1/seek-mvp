import { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate
} from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

import CheckInLanding from "./CheckInLanding";
import CheckIn from "./CheckIn";
import BarView from "./BarView";  // Ensure this component exists
import HotTonight from "./HotTonight";
import BulkBarUploader from "./BulkBarUploader";
import InstallPrompt from "./components/InstallPrompt";
import ChatRoom from "./ChatRoom";
import ProfileForm from "./components/ProfileForm";
import ProfileAuth from "./ProfileAuth";
import Modal from "./components/Modal";
import AuthForm from "./components/AuthForm";
import TestSeed from './TestSeed';
import logo from "./seek-logo.svg";
import EventsPage from "./EventsPage";
import EventSubmission from './EventSubmission';
import SubmitForm from "./SubmitForm";
import ModeratorDashboard from "./ModeratorDashboard";
import MapView from "./MapView";
import BarSearchPage from "./pages/BarSearchPage";

/* ---------------- BottomNav stays the same ---------------- */
function BottomNav() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleCheckInClick = () => {
    // Preserve user profile but clear check-in location info
    const saved = localStorage.getItem("checkinFormData");
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleaned = { ...parsed, city: "", bar: "" };
      localStorage.setItem("checkinFormData", JSON.stringify(cleaned));
    }
    localStorage.removeItem("lastCheckInCity");
    localStorage.removeItem("lastCheckInBar");
    navigate("/checkin-landing");
  };

  const getInitials = (name) => {
    if (!name) return "👤";
    return name.split(" ").map(w => w[0]).join("").toUpperCase();
  };

  const navItems = [
    { label: "✅", onClick: handleCheckInClick },
    { to: "/search", label: "🔍" },
    { to: "/hottonight", label: "🔥" },
    { to: "/chat", label: "💬" },
    { to: "/profile", label: user?.displayName || getInitials(user?.email || "") || "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 z-50 flex justify-around items-center h-14 text-xl sm:text-2xl sm:h-16 px-2">
      {navItems.map((item, index) =>
        item.onClick ? (
          <button
            key={index}
            onClick={item.onClick}
            className="flex-1 flex justify-center items-center text-gray-300 hover:text-white py-2"
            aria-label="checkin"
          >
            {item.label}
          </button>
        ) : (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex justify-center items-center ${
              location.pathname === item.to ? "text-blue-400" : "text-gray-300"
            } hover:text-white py-2`}
            aria-label={item.to.replace("/", "") || "home"}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

/* ---------------- App with FIRST-RUN gate only ---------------- */
function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 1) Anonymous auth (unchanged)
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => console.log("Signed in anonymously"))
      .catch((error) => console.error("Anonymous sign-in error:", error));
  }, []);

  // 2) FIRST-RUN ONLY: show CheckInLanding once on very first open
  useEffect(() => {
    const hasOpened = localStorage.getItem("hasOpened");
    if (!hasOpened) {
      localStorage.setItem("hasOpened", "1");
      navigate("/checkin-landing", { replace: true });
    }
  }, [navigate]);

  // 3) Header visibility (unchanged logic except we removed showCheckIn)
  const hideUI =
    location.pathname.startsWith("/checkin") ||
    location.pathname === "/city";

  return (
    <>
      {!hideUI && (
        <div className="fixed top-0 left-0 z-40 flex items-center px-4 py-2 bg-black/30 backdrop-blur-md shadow-none w-full">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Seek Logo" className="h-7 w-7 object-contain" />
            <span className="font-semibold text-lg text-white">Seek</span>
          </Link>
        </div>
      )}

      <main
        className={
          location.pathname === "/bar/none"
            ? "h-screen overflow-hidden"
            : hideUI
            ? ""
            : "flex-1 overflow-y-auto pt-14 pb-16"
        }
      >
        {/* 4) Single, stable route table — no more showCheckIn gating */}
        <Routes>
          {/* Home */}
          <Route path="/" element={<HotTonight />} />

          {/* Check-in flow */}
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/city" element={<CheckIn />} />
          <Route path="/checkin-landing" element={<CheckInLanding />} />

          {/* Destination after successful check-in */}
          <Route path="/barview/:barName" element={<BarView />} />
          <Route path="/bar/none" element={<BarView />} />

          {/* Other pages */}
          <Route path="/hottonight" element={<HotTonight />} />
          <Route path="/admin" element={<BulkBarUploader />} />
          <Route path="/chat" element={<ChatRoom />} />
          <Route path="/profile" element={<ProfileForm />} />
          <Route path="/admin-seed" element={<TestSeed />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/submit-event" element={<EventSubmission />} />
          <Route path="/submit" element={<SubmitForm />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/test-seed" element={<TestSeed />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/search" element={<BarSearchPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideUI && (
        <>
          <BottomNav />
          <InstallPrompt />
          <Modal isOpen={authOpen} onClose={() => setAuthOpen(false)}>
            <AuthForm onSignedUp={() => setAuthOpen(false)} />
          </Modal>
        </>
      )}
    </>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
