import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CheckIn from "./CheckIn";
import BarFeed from "./BarFeed"; // if you're using the feed
import BulkBarUploader from "./BulkBarUploader"; // if using uploader
import HotTonight from "./HotTonight";


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="text-center p-8">
              <h1 className="text-3xl font-bold mb-4">Welcome to Seek</h1>
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

      </Routes>
    </Router>
  );
}

export default App;
