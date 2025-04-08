import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Papa from "papaparse";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?gid=576309257&single=true&output=csv";

const allUSStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const allCountries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Germany", "Greece", "Guatemala", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kenya", "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Maldives", "Malta", "Mexico", "Moldova", "Monaco", "Mongolia", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Nigeria", "Norway", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Zambia", "Zimbabwe"];

const interestsOptions = ["Live Music", "Dancing", "Hiking", "Yoga", "Gaming", "Photography", "Art", "Travel", "Foodie", "Volunteering", "Reading", "Movies", "Clubbing", "Fitness", "Sports"];
const industryOptions = ["Tech", "Education", "Health Care", "Finance", "Government", "Marketing/Media", "Retail", "Hospitality", "Creative/Arts", "Law", "Engineering", "Non-profit", "Other"];

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    sexuality: "",
    school: "",
    homeState: "",
    homeCountry: "",
    homeCity: "",
    religion: "",
    politics: "",
    interests: [],
    industry: ""
  });

  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const debounceRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(prev => ({ ...prev, ...snap.data() }));
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const rawColleges = results.data.map(row => row.college?.trim()).filter(Boolean);
        const uniqueColleges = Array.from(new Set(rawColleges));
        setColleges(uniqueColleges);
        setFilteredColleges(uniqueColleges.slice(0, 10));
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSchoolChange = (e) => {
    const value = e.target.value;
    setProfile(prev => ({ ...prev, school: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filtered = colleges.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredColleges(filtered);
    }, 200);
  };

  const toggleInterest = (interest) => {
    setProfile(prev => {
      const isSelected = prev.interests.includes(interest);
      return {
        ...prev,
        interests: isSelected
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    alert("✅ Profile saved!");
  };

  if (loading) return <p className="text-white text-center">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-6 overflow-y-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">My Profile</h2>
      </div>

      <div className="bg-white rounded-3xl text-black shadow p-4 space-y-4 max-w-lg mx-auto w-full">
        <input name="name" placeholder="Name" className="w-full p-2 border rounded" value={profile.name} onChange={handleChange} />
        <input name="age" placeholder="Age" type="number" className="w-full p-2 border rounded" value={profile.age} onChange={handleChange} />

        <select name="gender" value={profile.gender} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Gender</option>
          {["Woman", "Man", "Transgender", "Non-binary/non-conforming", "Prefer not to respond"].map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select name="sexuality" value={profile.sexuality} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Sexuality</option>
          {["Asexual", "Bisexual", "Gay", "Heterosexual (straight)", "Lesbian", "Pansexual", "Queer", "Questioning", "Prefer not to specify"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input name="school" value={profile.school} onChange={handleSchoolChange} placeholder="Search your school" className="w-full p-2 border rounded" list="college-options" />
        <datalist id="college-options">
          {filteredColleges.map(col => <option key={col} value={col} />)}
        </datalist>

        <select name="homeState" value={profile.homeState} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select your home state</option>
          <option value="Not from the U.S.">I'm not from the U.S.</option>
          {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {profile.homeState === "Not from the U.S." && (
          <select name="homeCountry" value={profile.homeCountry} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">Select your country</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <input name="homeCity" placeholder="Hometown (City)" className="w-full p-2 border rounded" value={profile.homeCity} onChange={handleChange} />

        <select name="religion" value={profile.religion} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Religion</option>
          {["Agnostic", "Atheist", "Buddhist", "Catholic", "Christian", "Hindu", "Jewish", "Muslim", "Spiritual", "Other", "Prefer not to say"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select name="politics" value={profile.politics} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Political Views</option>
          {["Liberal", "Moderate", "Conservative", "Apolitical", "Other", "Prefer not to say"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div>
          <p className="text-sm font-medium mb-1">Hobbies & Interests</p>
          <div className="flex flex-wrap gap-2">
            {interestsOptions.map((interest) => (
              <button type="button" key={interest} onClick={() => toggleInterest(interest)} className={`px-3 py-1 rounded-full border text-sm ${profile.interests.includes(interest) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-black border-gray-300"}`}>{interest}</button>
            ))}
          </div>
        </div>

        <select name="industry" value={profile.industry} onChange={handleChange} className="w-full p-2 border rounded">
          <option value="">Select Industry</option>
          {industryOptions.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>

        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded font-semibold mt-4">
          Save Profile
        </button>
      </div>
    </div>
  );
}