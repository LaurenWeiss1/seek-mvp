import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import Papa from "papaparse";

const genderOptions = [
  "Man",
  "Woman",
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

const countries = [
  "Canada",
  "Mexico",
  "United Kingdom",
  "Germany",
  "India",
  "China",
  "Japan",
  "Australia",
  "France",
  "Other"
];

const allUSStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

function CheckIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    sexuality: "",
    homeState: "",
    homeCountry: "",
    college: "",
    currentState: "",
    city: "",
    bar: "",
    openToChat: false
  });

  const [cities, setCities] = useState([]);
  const [bars, setBars] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [barNotListed, setBarNotListed] = useState(false);
  const [customBar, setCustomBar] = useState("");

  useEffect(() => {
    const stateCitySheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv";
    const collegeSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?gid=576309257&single=true&output=csv";



    Papa.parse(stateCitySheet, {
      download: true,
      header: true,
      complete: (results) => {
        const cityList = results.data.map(row => ({ name: row.city, state: row.state }));
        const barList = results.data.flatMap(row =>
          row.bars ? row.bars.split(";").map(bar => ({ name: bar.trim(), city: row.city })) : []
        );
        setCities(cityList);
        setBars(barList);
      }
    });

    Papa.parse(collegeSheet, {
      download: true,
      header: true,
      complete: (results) => {
        const collegeList = results.data.map(row => row.college).filter(Boolean);
        setColleges(collegeList);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBar = barNotListed ? customBar : formData.bar;
    try {
      await addDoc(collection(db, "checkins"), {
        ...formData,
        bar: finalBar,
        timestamp: serverTimestamp(),
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
      console.error("Check-in error:", err);
    }
  };

  const filteredCities = cities.filter(c => c.state === formData.currentState);
  const filteredBars = bars.filter(b => b.city === formData.city);
  const filteredColleges = colleges.filter(col => col.toLowerCase().includes(formData.college.toLowerCase()));

  return (
    <form onSubmit={handleSubmit} className="bg-[#111827] text-white max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-center">Welcome to Seek <span className="inline-block">👋</span></h1>

      <input name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" required />

      <div>
        <label className="block mb-2">Gender</label>
        <div className="space-y-1">
          {genderOptions.map(g => (
            <label key={g} className="block">
              <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} className="mr-2" />
              {g}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-2">Sexuality</label>
        <div className="space-y-1">
          {sexualityOptions.map(s => (
            <label key={s} className="block">
              <input type="radio" name="sexuality" value={s} checked={formData.sexuality === s} onChange={handleChange} className="mr-2" />
              {s}
            </label>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold pt-4">Where are you from?</h2>
      <select name="homeState" value={formData.homeState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
        <option value="">Select your home state</option>
        <option value="Not from the U.S.">I'm not from the U.S.</option>
        {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
      </select>

      {formData.homeState === "Not from the U.S." && (
        <select name="homeCountry" value={formData.homeCountry} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Select your country</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      <h2 className="text-lg font-semibold pt-4">Where did you go to college/university?</h2>
      <input
        name="college"
        value={formData.college}
        onChange={handleChange}
        placeholder="Enter your college/university"
        className="w-full p-2 rounded bg-[#1F2937] border border-gray-600"
        list="college-options"
      />
      <datalist id="college-options">
        {filteredColleges.map(col => <option key={col} value={col} />)}
      </datalist>

      <h2 className="text-lg font-semibold pt-4">Which state are you currently in?</h2>
      <select name="currentState" value={formData.currentState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
        <option value="">Select a state</option>
        {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
      </select>

      {formData.currentState && (
        <>
          <h2 className="text-lg font-semibold pt-4">Which city are you currently in?</h2>
          <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
            <option value="">Select a city</option>
            {filteredCities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
          </select>
        </>
      )}

      {formData.city && (
        <>
          <h2 className="text-lg font-semibold pt-4">Which bar are you at?</h2>
          <select name="bar" value={formData.bar} onChange={handleChange} disabled={barNotListed} className="w-full p-2 rounded bg-white text-black">
            <option value="">Select a bar</option>
            {filteredBars.map(bar => <option key={bar.name} value={bar.name}>{bar.name}</option>)}
          </select>

          <label className="block mt-2">
            <input
              type="checkbox"
              checked={barNotListed}
              onChange={(e) => setBarNotListed(e.target.checked)}
              className="mr-2"
            />
            Bar not listed
          </label>

          {barNotListed && (
            <input
              name="customBar"
              value={customBar}
              onChange={(e) => setCustomBar(e.target.value)}
              placeholder="Enter bar name here"
              required
              className="w-full p-2 rounded bg-[#1F2937] border border-gray-600"
            />
          )}
        </>
      )}

      <label className="block">
        <input
          type="checkbox"
          name="openToChat"
          checked={formData.openToChat}
          onChange={handleChange}
          className="mr-2"
        />
        I'm open to chat 👋
      </label>

      <button type="submit" className="w-full bg-gray-700 text-white py-2 rounded mt-4 hover:bg-gray-600">Submit</button>
    </form>
  );
}

export default CheckIn;
