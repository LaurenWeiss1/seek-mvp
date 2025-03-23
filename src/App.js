import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckIn from "./CheckIn";
import BarView from "./BarView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/bar/:barName" element={<BarView />} />
      </Routes>
    </Router>
  );
}

export default App;
