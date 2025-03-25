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
  "Man", "Woman", "Transgender", "Non-binary/non-conforming", "Prefer not to respond"
];

const sexualityOptions = [
  "Asexual", "Bisexual", "Gay", "Heterosexual (straight)",
  "Lesbian", "Pansexual", "Queer", "Questioning", "Prefer not to specify"
];

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

function CheckIn() {
  const navigate = useNavigate();
  const sheetUrl = "YOUR_CSV_LINK_HERE";
  const { hometowns, states, countries, colleges } = useAutocompleteData(sheetUrl);

  const [formData, setFormData] = useState({
    name: "", age: "", gender: "", sexuality: "", hometown: "",
    homeState: "", homeCountry: "", college: "", city: "", bar: "",
    openToChat: false
  });

  const [allBars, setAllBars] = useState([]);
  const [barNotListed, setBarNotListed] = useState(false);
  const [customBar, setCustomBar] = useState("");

  useEffect(() => {
    const fetchBars = async () => {
      if (!formData.city) return;
      const q = query(collection(db, "bars"), where("city", "==", formData.city));
      const snapshot = await getDocs(q);
      const barsInCity = snapshot.docs.map(doc => doc.data().name);
      setAllBars(barsInCity);
    };
    fetchBars();
  }, [formData.city]);

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
      console.error("Check-in error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#111827] text-white max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-center mb-4">Welcome to Seek 👋</h1>

      <input name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age" required className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />

      <div>
        <label className="block mb-2 mt-4">Gender</label>
        <div className="space-y-2">
          {genderOptions.map(g => (
            <label key={g} className="block">
              <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} className="mr-2" />
              {g}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-2 mt-4">Sexuality</label>
        <div className="space-y-2">
          {sexualityOptions.map(s => (
            <label key={s} className="block">
              <input type="radio" name="sexuality" value={s} checked={formData.sexuality === s} onChange={handleChange} className="mr-2" />
              {s}
            </label>
          ))}
        </div>
      </div>

      <input name="hometown" value={formData.hometown} onChange={handleChange} placeholder="Hometown" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />
      <input name="homeState" value={formData.homeState} onChange={handleChange} placeholder="Home State" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />
      <input name="homeCountry" value={formData.homeCountry} onChange={handleChange} placeholder="Home Country" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />
      <input name="college" value={formData.college} onChange={handleChange} placeholder="College / University" className="w-full p-2 rounded bg-[#1F2937] border border-gray-600" />

      <select name="city" value={formData.city} onChange={handleChange} className="w-full p-2 rounded bg-white text-black">
        <option value="">Select a city</option>
        {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {formData.city && (
        <>
          <select name="bar" value={formData.bar} onChange={handleChange} disabled={barNotListed} className="w-full p-2 rounded bg-white text-black">
            <option value="">Select a bar</option>
            {allBars.map(b => <option key={b} value={b}>{b}</option>)}
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

      <label className="block mt-2">
        <input
          type="checkbox"
          name="openToChat"
          checked={formData.openToChat}
          onChange={handleChange}
          className="mr-2"
        />
        I'm open to chat 👋
      </label>

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4">Submit</button>
    </form>
  );
}

export default CheckIn;
