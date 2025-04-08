import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const cityOptions = ["Berkeley", "San Francisco", "New York", "Los Angeles"];

export default function EventSubmissionForm() {
  const [type, setType] = useState("event");
  const [form, setForm] = useState({
    title: "",
    description: "",
    barName: "",
    city: "Berkeley",
    datetime: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const collectionName = type === "event" ? "events" : "promos";
    const payload = {
      ...form,
      timestamp: type === "event" ? Timestamp.fromDate(new Date(form.datetime)) : Timestamp.now()
    };

    await addDoc(collection(db, collectionName), payload);
    setSubmitted(true);
    setForm({ title: "", description: "", barName: "", city: "Berkeley", datetime: "" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="bg-white text-black rounded-2xl p-6 shadow max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">✅ Submission received!</h2>
          <p>Thanks for sharing your {type}. It will appear in the app shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-black rounded-2xl p-6 shadow max-w-md w-full space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Submit an Event or Promo</h2>

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => setType("event")}
            className={`px-4 py-2 rounded-full font-semibold ${type === "event" ? "bg-black text-white" : "bg-gray-200"}`}
          >
            Event
          </button>
          <button
            type="button"
            onClick={() => setType("promo")}
            className={`px-4 py-2 rounded-full font-semibold ${type === "promo" ? "bg-black text-white" : "bg-gray-200"}`}
          >
            Promo
          </button>
        </div>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="Title"
          className="w-full border rounded px-3 py-2"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          placeholder="Description"
          className="w-full border rounded px-3 py-2"
        />

        <input
          name="barName"
          value={form.barName}
          onChange={handleChange}
          required
          placeholder="Bar Name"
          className="w-full border rounded px-3 py-2"
        />

        <select
          name="city"
          value={form.city}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          {cityOptions.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {type === "event" && (
          <input
            type="datetime-local"
            name="datetime"
            value={form.datetime}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        )}

        <button type="submit" className="w-full bg-black text-white py-2 rounded font-semibold">
          Submit
        </button>
      </form>
    </div>
  );
}
