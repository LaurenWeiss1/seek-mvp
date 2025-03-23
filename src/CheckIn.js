import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import AutocompleteInput from "./AutocompleteInput";
import useAutocompleteData from "./useAutocompleteData";
import useBars from "./useBars";

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

function CheckIn() {
  const navigate = useNavigate();

  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv"; // Replace with your actual Google Sheet CSV link
  const { hometowns, states, countries, colleges } = useAutocompleteData(sheetUrl);
  const barList = useBars();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    sexuality: "",
    hometown: "",
    homeState: "",
    homeCountry: "",
    college: "",
    bar: ""
  });

  const [customBar, setCustomBar] = useState("");
  const [barNotListed, setBarNotListed] = useState(false);
  const [filteredBars, setFilteredBars] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "bar") {
      const matches = barList.filter((bar) =>
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
          createdAt: serverTimestamp()
        });
      }

      navigate(`/bar/${finalBar}`);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>Check In</h2>
      <form onSubmit={handleSubmit}>
        <label>Name (optional):</label><br />
        <input name="name" value={formData.name} onChange={handleChange} /><br /><br />

        <label>Age:</label><br />
        <input name="age" value={formData.age} onChange={handleChange} required /><br /><br />

        <AutocompleteInput
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          options={genderOptions}
        />

        <AutocompleteInput
          label="Sexuality"
          name="sexuality"
          value={formData.sexuality}
          onChange={handleChange}
          options={sexualityOptions}
        />

        <AutocompleteInput
          label="Hometown"
          name="hometown"
          value={formData.hometown}
          onChange={handleChange}
          options={hometowns}
        />

        <AutocompleteInput
          label="Home State"
          name="homeState"
          value={formData.homeState}
          onChange={handleChange}
          options={states}
        />

        <AutocompleteInput
          label="Home Country"
          name="homeCountry"
          value={formData.homeCountry}
          onChange={handleChange}
          options={countries}
        />

        <AutocompleteInput
          label="College / University"
          name="college"
          value={formData.college}
          onChange={handleChange}
          options={colleges}
        />

        <label>Bar you're at:</label><br />
        <input
          type="text"
          name="bar"
          value={formData.bar}
          onChange={handleChange}
          autoComplete="off"
          disabled={barNotListed}
          required={!barNotListed}
        />
        {showSuggestions && filteredBars.length > 0 && !barNotListed && (
          <ul style={{
            border: "1px solid #ccc",
            padding: 5,
            listStyle: "none",
            marginTop: 0
          }}>
            {filteredBars.map((bar, index) => (
              <li
                key={index}
                onMouseDown={() => handleBarSelect(bar)}
                style={{ padding: "4px 8px", cursor: "pointer" }}
              >
                {bar}
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={barNotListed}
              onChange={(e) => setBarNotListed(e.target.checked)}
            />{" "}
            Bar not listed
          </label>
        </div>

        {barNotListed && (
          <div style={{ marginTop: 10 }}>
            <label>Enter bar name here:</label><br />
            <input
              name="customBar"
              value={customBar}
              onChange={(e) => setCustomBar(e.target.value)}
              placeholder="Enter bar name here"
              required
            />
          </div>
        )}

        <br />
        <button type="submit">Check In</button>
      </form>
    </div>
  );
}

export default CheckIn;
