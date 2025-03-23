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
    bar: ""
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
    const finalBar = barNotListed ? customBar : formData.bar;

    try {
      await addDoc(collection(db, "checkins"), {
        ...formData,
        bar: finalBar,
        timestamp: serverTimestamp()
      });

      if (barNotListed && customBar) {
        await addDoc(collection(db, "bars"), {
          name: customBar,
          city: formData.city,
          createdAt: serverTimestamp()
        });
      }

      navigate(`/bar/${finalBar}`);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Check In</h2>
      <form onSubmit={handleSubmit}>
        <label>Name (optional):</label><br />
        <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 mb-3" /><br />

        <label>Age:</label><br />
        <input name="age" value={formData.age} onChange={handleChange} required className="w-full border p-2 mb-3" /><br />

        <label className="font-semibold">Gender:</label>
        <div className="mb-3">
          {genderOptions.map((option) => (
            <label key={option} className="block">
              <input
                type="radio"
                name="gender"
                value={option}
                checked={formData.gender === option}
                onChange={handleChange}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>

        <label className="font-semibold">Sexuality:</label>
        <div className="mb-3">
          {sexualityOptions.map((option) => (
            <label key={option} className="block">
              <input
                type="radio"
                name="sexuality"
                value={option}
                checked={formData.sexuality === option}
                onChange={handleChange}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>

        <label>Hometown:</label><br />
        <input name="hometown" value={formData.hometown} onChange={handleChange} className="w-full border p-2 mb-3" /><br />

        <label>Home State:</label><br />
        <input name="homeState" value={formData.homeState} onChange={handleChange} className="w-full border p-2 mb-3" /><br />

        <label>Home Country:</label><br />
        <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} className="w-full border p-2 mb-3" /><br />

        <label>College / University:</label><br />
        <input name="college" value={formData.college} onChange={handleChange} className="w-full border p-2 mb-3" /><br />

        <label>City:</label><br />
        <select name="city" value={formData.city} onChange={handleChange} className="w-full border p-2 mb-3" required>
          <option value="">Select a city</option>
          {cityOptions.map((city, idx) => (
            <option key={idx} value={city}>{city}</option>
          ))}
        </select>

        {formData.city && (
          <>
            <label>Bar you're at:</label><br />
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
              className="w-full border p-2"
            />
            {showSuggestions && filteredBars.length > 0 && !barNotListed && (
              <ul className="border bg-white max-h-40 overflow-y-scroll text-sm">
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

            <div className="mt-2">
              <label>
                <input
                  type="checkbox"
                  checked={barNotListed}
                  onChange={(e) => setBarNotListed(e.target.checked)}
                /> {" "}Bar not listed
              </label>
            </div>

            {barNotListed && (
              <div className="mt-2">
                <label>Enter bar name here:</label><br />
                <input
                  name="customBar"
                  value={customBar}
                  onChange={(e) => setCustomBar(e.target.value)}
                  placeholder="Enter bar name here"
                  required
                  className="w-full border p-2"
                />
              </div>
            )}
          </>
        )}

        <br />
        <button type="submit" className="mt-4 w-full bg-blue-500 text-white p-2 rounded">Check In</button>
      </form>
    </div>
  );
}

export default CheckIn;
