import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

export default function SubmitForm() {
  const [tab, setTab] = useState("event");
  const [form, setForm] = useState({
    title: "",
    description: "",
    barName: "",
    city: "Berkeley",
    timestamp: ""
  });
  const navigate = useNavigate();
  const isEvent = tab === "event";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectionName = isEvent ? "events" : "promos";
    const data = {
      ...form,
      approved: false,
      timestamp: isEvent ? Timestamp.fromDate(new Date(form.timestamp)) : Timestamp.now()
    };
    await addDoc(collection(db, collectionName), data);
    alert("✅ Submitted for review!");
    navigate("/events");
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-28 px-4">
      <h2 className="text-3xl font-bold text-center mb-6">Submit a {isEvent ? "Event" : "Promo"}</h2>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab("event")}
          className={`px-4 py-2 rounded-full font-semibold ${isEvent ? "bg-white text-black" : "bg-gray-700 text-white"}`}
        >
          Event
        </button>
        <button
          onClick={() => setTab("promo")}
          className={`px-4 py-2 rounded-full font-semibold ${!isEvent ? "bg-white text-black" : "bg-gray-700 text-white"}`}
        >
          Promo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-2 rounded text-black"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 rounded text-black"
          required
        />

        <input
          type="text"
          name="barName"
          placeholder="Bar Name"
          value={form.barName}
          onChange={handleChange}
          className="w-full p-2 rounded text-black"
          required
        />

        <select
          name="city"
          value={form.city}
          onChange={handleChange}
          className="w-full p-2 rounded text-black"
        >
          {cityOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {isEvent && (
          <input
            type="datetime-local"
            name="timestamp"
            value={form.timestamp}
            onChange={handleChange}
            className="w-full p-2 rounded text-black"
            required
          />
        )}

        <button
          type="submit"
          className="w-full bg-white text-black font-semibold px-4 py-2 rounded-full hover:bg-gray-200"
        >
          Submit for Review
        </button>
      </form>
    </div>
  );
}
