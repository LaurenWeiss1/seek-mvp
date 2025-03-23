import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckIn from "./CheckIn";
// import Feed or other pages as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div style={{ padding: 40 }}><h1>Welcome to Seek</h1><p><a href="/checkin">Go to Check-In →</a></p></div>} />
        <Route path="/checkin" element={<CheckIn />} />
        {/* add more routes here like <Route path="/bar/:barName" element={<BarFeed />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
