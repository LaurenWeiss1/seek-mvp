import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Papa from "papaparse";
import Select from "react-select";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmNCSLKaFGoRDnnOI_HkZ1pPYAHBzTx2KtsPFiQl347KYxbm-iy5Gjl5XjVuR7-00qW12_n7h-ovkI/pub?gid=576309257&single=true&output=csv";

const allUSStates = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const allCountries = [/* keep same as before */];

const interestsOptions = [
  "Live Music", "Dancing", "Hiking", "Yoga", "Gaming", "Photography", "Art",
  "Travel", "Foodie", "Volunteering", "Reading", "Movies", "Clubbing", "Fitness", "Sports"
];
const industryOptions = [
  "Tech","Education","Health Care","Finance","Government","Marketing/Media",
  "Retail","Hospitality","Creative/Arts","Law","Engineering","Non-profit","Other"
];

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
  }, [user]);

  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const rawColleges = results.data
          .map(row => row.college?.trim())
          .filter(Boolean);
        const uniqueColleges = Array.from(new Set(rawColleges)).sort();
        setColleges(uniqueColleges);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
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
    <div
      className="relative min-h-screen p-6 text-white"
      style={{
        backgroundColor: "#0b0d12",
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 max-w-xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center">My Profile</h2>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 space-y-4">
          <input
            name="name"
            placeholder="Name"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500"
            value={profile.name}
            onChange={handleChange}
          />

          <input
            name="age"
            placeholder="Age"
            type="number"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500"
            value={profile.age}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select Gender</option>
            {["Woman","Man","Transgender","Non-binary/non-conforming","Prefer not to respond"].map(
              g => <option key={g} value={g}>{g}</option>
            )}
          </select>

          <select
            name="sexuality"
            value={profile.sexuality}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select Sexuality</option>
            {[
              "Asexual","Bisexual","Gay","Heterosexual (straight)","Lesbian","Pansexual","Queer",
              "Questioning","Prefer not to specify"
            ].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* College searchable dropdown */}
          <Select
            options={colleges.map(c => ({ label: c, value: c }))}
            value={profile.school ? { label: profile.school, value: profile.school } : null}
            onChange={selected =>
              setProfile(prev => ({ ...prev, school: selected ? selected.value : '' }))
            }
            placeholder="Search or select your college"
            isClearable
            isSearchable
            className="text-black"
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary25: '#1f2937',
                primary: '#3b82f6',
                neutral0: '#1f2937',
                neutral80: 'white',
                neutral20: '#374151',
              },
            })}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                color: 'white',
              }),
              input: (base) => ({ ...base, color: 'white' }),
              singleValue: (base) => ({ ...base, color: 'white' }),
              menu: (base) => ({ ...base, backgroundColor: '#1f2937', color: 'white' }),
            }}
          />

          <select
            name="homeState"
            value={profile.homeState}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select your home state</option>
            <option value="Not from the U.S.">I'm not from the U.S.</option>
            {allUSStates.map(state => <option key={state} value={state}>{state}</option>)}
          </select>

          {profile.homeState === "Not from the U.S." && (
            <select
              name="homeCountry"
              value={profile.homeCountry}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-white text-black"
            >
              <option value="">Select your country</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <input
            name="homeCity"
            placeholder="Hometown (City)"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10"
            value={profile.homeCity}
            onChange={handleChange}
          />

          <select
            name="religion"
            value={profile.religion}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select Religion</option>
            {[
              "Agnostic","Atheist","Buddhist","Catholic","Christian","Hindu","Jewish","Muslim",
              "Spiritual","Other","Prefer not to say"
            ].map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            name="politics"
            value={profile.politics}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select Political Views</option>
            {[
              "Liberal","Moderate","Conservative","Apolitical","Other","Prefer not to say"
            ].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div>
            <p className="text-sm font-medium mb-2 text-gray-200">
              Hobbies & Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {interestsOptions.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    profile.interests.includes(interest)
                      ? "bg-[#A1C5E6] text-black border-[#A1C5E6]"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <select
            name="industry"
            value={profile.industry}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white text-black"
          >
            <option value="">Select Industry</option>
            {industryOptions.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>

          <button
            onClick={handleSave}
            className="w-full bg-[#A1C5E6] text-black py-3 rounded-xl font-semibold hover:scale-105 transition"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
