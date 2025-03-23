import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

import useAutocompleteData from "./useAutocompleteData";

const genderOptions = [
  "Woman",
  "Man",
  "Transgender",
  "Non-binary/non-conforming",
  "Prefer not to respond"
];

const sexualityOptions = [
  "Asexual",
  "Bisexual",
  "Gay",
  "Heterosexual (straight)",
  "Lesbian",
  "Pansexual",
  "Queer",
  "Questioning",
  "Prefer not to specify"
];

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

function CheckIn() {
  const navigate = useNavigate();
  const sheetUrl = "YOUR_CSV_LINK_HERE"; // Replace with your actual Google Sheet CSV
  const { hometowns, states, countries, colleges } = useAutocompleteData(sheetUrl);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    sexuality: "",
    hometown: "",
    homeState: "",
    homeCountry: "",
    college: "",
    city: "",
    bar: "",
    openToChat: false
  });

  const [customBar, setCustomBar] = useState("");
  const [barNotListed, setBarNotListed] = useState(false);
  const [filteredBars, setFilteredBars] = useState([]);
  const [allBars, setAllBars] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchBarsByCity = async () => {
      if (!formData.city) return;
      try {
        const q = query(collection(db, "bars"), where("city", "==", formData.city));
        const snapshot = await getDocs(q);
        const barsInCity = snapshot.docs.map((doc) => doc.data().name);
        setAllBars(barsInCity);
      } catch (err) {
        console.error("Error fetching bars by city:", err);
      }
    };
    fetchBarsByCity();
  }, [formData.city]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (name === "city") {
      setFormData((prev) => ({ ...prev, city: value, bar: "" }));
      setFilteredBars([]);
      setShowSuggestions(false);
    } else if (name === "bar") {
      const matches = allBars.filter((bar) =>
        bar.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBars(matches);
      setShowSuggestions(true);
    }
  };

  const handleBarSelect = (barName) => {
    setFormData((prev) => ({ ...prev, bar: barName }));
    setFilteredBars([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBar = (barNotListed ? customBar : formData.bar).trim();
    console.log("📤 Attempting to check in to:", finalBar);
  
    try {
      const checkinData = {
        ...formData,
        bar: finalBar,
        timestamp: serverTimestamp(),
      };
  
      console.log("📦 Data being sent:", checkinData);
  
      await addDoc(collection(db, "checkins"), checkinData);
      console.log("✅ Check-in saved to Firestore");
  
      localStorage.setItem("viewerInfo", JSON.stringify(formData));
  
      if (barNotListed && customBar) {
        await addDoc(collection(db, "bars"), {
          name: customBar.trim(),
          city: formData.city,
          createdAt: serverTimestamp(),
        });
      }
  
      navigate(`/bar/${finalBar}`);
    } catch (err) {
      console.error("❌ Error submitting form:", err);
    }
  };
  

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Check In</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-4 rounded-xl shadow border">
          <h3 className="text-lg font-semibold mb-3">Your Info</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Name (optional)" className="border p-2 rounded w-full" />
            <input name="age" value={formData.age} onChange={handleChange} placeholder="Age" required className="border p-2 rounded w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded">
              <option value="">Gender</option>
              {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            <select name="sexuality" value={formData.sexuality} onChange={handleChange} className="border p-2 rounded">
              <option value="">Sexuality</option>
              {sexualityOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <input name="hometown" value={formData.hometown} onChange={handleChange} placeholder="Hometown" className="border p-2 rounded w-full mt-4" />
          <input name="homeState" value={formData.homeState} onChange={handleChange} placeholder="Home State" className="border p-2 rounded w-full mt-2" />
          <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} placeholder="Home Country" className="border p-2 rounded w-full mt-2" />
          <input name="college" value={formData.college} onChange={handleChange} placeholder="College / University" className="border p-2 rounded w-full mt-2" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow border">
          <h3 className="text-lg font-semibold mb-3">Where You're At</h3>

          <select name="city" value={formData.city} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select City</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>

          {formData.city && (
            <>
              <input
                type="text"
                name="bar"
                value={formData.bar}
                onChange={handleChange}
                onFocus={() => {
                  setFilteredBars(allBars);
                  setShowSuggestions(true);
                }}
                autoComplete="off"
                disabled={barNotListed}
                required={!barNotListed}
                placeholder="Bar you're at"
                className="border p-2 rounded w-full mt-4"
              />
              {showSuggestions && filteredBars.length > 0 && !barNotListed && (
                <ul className="border bg-white max-h-40 overflow-y-scroll text-sm rounded shadow mt-1">
                  {filteredBars.map((bar, index) => (
                    <li
                      key={index}
                      onMouseDown={() => handleBarSelect(bar)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {bar}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={barNotListed}
                    onChange={(e) => setBarNotListed(e.target.checked)}
                    className="mr-2"
                  />
                  Bar not listed
                </label>
              </div>

              {barNotListed && (
                <input
                  name="customBar"
                  value={customBar}
                  onChange={(e) => setCustomBar(e.target.value)}
                  placeholder="Enter bar name here"
                  required
                  className="w-full border p-2 rounded mt-2"
                />
              )}
            </>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="openToChat"
            checked={formData.openToChat}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm">I'm open to chat 👋</label>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow">
          Check In
        </button>
      </form>
    </div>
  );
}

export default CheckIn;
