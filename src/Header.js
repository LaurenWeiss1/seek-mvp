import { Link, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import logo from "./seek-logo.svg";

export default function Header({ onOpenAuth, onOpenProfile }) {
  const location = useLocation();
  const [user] = useAuthState(auth);

  const navLinks = [
    { path: "/hot", label: "🔥" },
    { path: "/chat", label: "💬" },
    { path: "/bar/Berkeley", label: "🧭" }, // default route for bar feed
    { path: "/checkin", label: "✅" },
    { to: "/events", label: "🔔" },
    { to: "/map", label: "🗺️" },


  ];

  const getInitials = (name) => {
    if (!name) return "👤";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-3 py-2 sm:px-4">

        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Seek Logo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-base sm:text-lg text-gray-800 tracking-tight">Seek</span>
        </Link>

        {/* Center: Nav Icons */}
        <nav className="flex gap-3 text-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-2 py-1 rounded-md transition font-medium ${
                location.pathname === link.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-blue-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Profile Avatar */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={onOpenProfile}
              className="text-xl border border-gray-300 rounded-full px-2 py-1 hover:bg-gray-100"
            >
              👤
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-sm text-gray-700 underline hover:text-black transition"
            >
              Log In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
