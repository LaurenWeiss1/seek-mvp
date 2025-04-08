import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import {
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
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
  "Heterosexual (straight)",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Queer",
  "Asexual",
  "Pansexual",
  "Questioning",
  "Prefer not to specify"
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
  const [user, setUser] = useState(null);
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
    bar: ""
  });

  const [cities, setCities] = useState([]);
  const [bars, setBars] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [barNotListed, setBarNotListed] = useState(false);
  const [customBar, setCustomBar] = useState("");
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [filteredBars, setFilteredBars] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const profile = snap.data();
          setFormData(prev => ({
            ...prev,
            name: profile.name || "",
            age: profile.age || "",
            gender: profile.gender || "",
            sexuality: profile.sexuality || "",
            college: profile.school || profile.college || "",
            homeState: profile.homeState || "",
            homeCountry: profile.homeCountry || "",
            homeCity: profile.homeCity || "",
          }));
        }
      }
      
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const barSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?output=csv";
    const collegeSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?gid=576309257&single=true&output=csv";

    Papa.parse(barSheet, {
      download: true,
      header: true,
      complete: (results) => {
        const rawCityList = results.data.map(row => row.city?.trim()).filter(Boolean);
        const uniqueCities = Array.from(new Set(rawCityList)).map(name => {
          const matchingRow = results.data.find(row => row.city?.trim() === name);
          return { name, state: matchingRow?.state || "" };
        });

        const barList = results.data.map(row => ({
          name: row.bar,
          city: row.city,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        })).filter(b => b.name && b.city);

        setCities(uniqueCities);
        setBars(barList);
      }
    });

    Papa.parse(collegeSheet, {
      download: true,
      header: true,
      complete: (results) => {
        const collegeList = results.data.map(row => row.college?.trim()).filter(Boolean);
        setColleges(Array.from(new Set(collegeList)));
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "college") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const filtered = colleges.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 10);
        setFilteredColleges(filtered);
      }, 250);
    }

    if (name === "bar") {
      const filtered = bars.filter(b => b.city === formData.city && b.name.toLowerCase().includes(value.toLowerCase())).slice(0, 10);
      setFilteredBars(filtered);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      const wantsProfile = window.confirm("Want to save your info and create a profile?");
      if (wantsProfile) {
        alert("Redirect to sign up or create an account form here");
        return;
      } else {
        try {
          await signInAnonymously(auth);
          console.log("✅ Anonymous sign-in complete");
        } catch (error) {
          console.error("❌ Error signing in anonymously:", error);
          return;
        }
      }
    }

    const finalBar = barNotListed ? customBar : formData.bar;

    try {
      const checkinRef = await addDoc(collection(db, "checkins"), {
        ...formData,
        bar: finalBar,
        timestamp: serverTimestamp()
      });

      // If user is signed in, update their profile with check-in info
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          ...formData,
          lastCheckIn: {
            bar: finalBar,
            city: formData.city,
            timestamp: new Date().toISOString()
          }
        }, { merge: true });
      }

      if (barNotListed && customBar) {
        await addDoc(collection(db, "bars"), {
          name: customBar,
          city: formData.city,
          createdAt: serverTimestamp()
        });
      }

      alert("✅ You’re checked in!");
      navigate(`/bar/${finalBar}`);
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const filteredCities = cities.filter(c => c.state === formData.currentState);
  const displayBars = filteredBars.length > 0 ? filteredBars : bars.filter(b => b.city === formData.city);

  return (
    <div className="min-h-screen bg-[#111827] overflow-y-auto pt-20">
      <form onSubmit={handleSubmit} className="text-white max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-4xl font-bold text-center">Welcome to Seek <span className="inline-block">👋</span></h1>

        <input name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" required />
        <input name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" required />

        <div>
          <label className="block mb-2">Gender</label>
          {genderOptions.map(g => (
            <label key={g} className="block">
              <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} className="mr-2" />
              {g}
            </label>
          ))}
        </div>

        <div>
          <label className="block mb-2">Sexuality</label>
          {sexualityOptions.map(s => (
            <label key={s} className="block">
              <input type="radio" name="sexuality" value={s} checked={formData.sexuality === s} onChange={handleChange} className="mr-2" />
              {s}
            </label>
          ))}
        </div>

        <select name="homeState" value={formData.homeState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Select your home state</option>
          <option value="Not from the U.S.">I'm not from the U.S.</option>
          {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {formData.homeState === "Not from the U.S." && (
          <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} placeholder="Enter your country" className="w-full p-2 rounded bg-white text-black" />
        )}

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

        <select name="currentState" value={formData.currentState} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
          <option value="">Select current state</option>
          {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {formData.currentState && (
          <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
            <option value="">Select city</option>
            {filteredCities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
          </select>
        )}

        {formData.city && (
          <>
            <input
              type="text"
              name="bar"
              value={formData.bar}
              onChange={handleChange}
              placeholder="Start typing to find your bar"
              disabled={barNotListed}
              className="w-full p-2 rounded bg-white text-black"
              list="bar-options"
            />
            <datalist id="bar-options">
              {displayBars.map(bar => <option key={bar.name} value={bar.name} />)}
            </datalist>

            <label className="block mt-2">
              <input type="checkbox" checked={barNotListed} onChange={(e) => setBarNotListed(e.target.checked)} className="mr-2" />
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

        <button type="submit" className="w-full bg-gray-700 text-white py-2 rounded mt-4 hover:bg-gray-600">Submit</button>
      </form>
    </div>
  );
}

export default CheckIn;
