import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CheckIn from "./CheckIn";
import BarFeed from "./BarFeed";
import BulkBarUploader from "./BulkBarUploader";
import HotTonight from "./HotTonight";
import MapView from "./MapView";
import Header from "./Header";

function App() {
  return (
    <Router>
      <Header />
      <div className="pt-20 px-4">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center p-8">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">
                  Tailwind is working!
                </h1>
                <p className="text-lg text-gray-700 mb-6">
                  Welcome to Seek — let’s get started!
                </p>
                <Link
                  to="/checkin"
                  className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  Check In
                </Link>
              </div>
            }
          />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/bar/:barName" element={<BarFeed />} />
          <Route path="/admin" element={<BulkBarUploader />} />
          <Route path="/hot" element={<HotTonight />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
