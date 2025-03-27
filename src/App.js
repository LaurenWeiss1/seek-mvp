import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import CheckInLanding from "./CheckInLanding";
import CheckIn from "./CheckIn";
import BarFeed from "./BarFeed";
import HotTonight from "./HotTonight";
import MapView from "./MapView";
import BulkBarUploader from "./BulkBarUploader";
import InstallPrompt from "./components/InstallPrompt"; // ✅ Added back

function App() {
  return (
    <Router>
      <Header />
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<CheckInLanding />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/bar/:barName" element={<BarFeed />} />
          <Route path="/hot" element={<HotTonight />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/admin" element={<BulkBarUploader />} />
        </Routes>
      </div>

      <InstallPrompt /> {/* 👈 Appears across all pages */}
    </Router>
  );
}

export default App;
