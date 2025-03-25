import { Link, useLocation } from "react-router-dom";
import logo from "./seek-logo.svg";

function Header() {
  const location = useLocation();

  const navLinks = [
    { path: "/hot", label: "🔥 Hot" },
    { path: "/map", label: "🗺️ Map" },
    { path: "/checkin", label: "✅ Check In" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Seek Logo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-lg text-gray-800 tracking-tight">Seek</span>
        </Link>

        <nav className="flex gap-3 md:gap-6 text-sm md:text-base">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1 rounded-md transition font-medium ${
                location.pathname === link.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-blue-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
