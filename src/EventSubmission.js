import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function BarEventSubmission() {
  const [form, setForm] = useState({
    type: "event",
    title: "",
    description: "",
    barName: "",
    city: "Berkeley",
    timestamp: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (form.type === "event" && form.timestamp) {
      data.timestamp = Timestamp.fromDate(new Date(form.timestamp));
    }

    const targetCollection = form.type === "promo" ? "promos" : "events";
    await addDoc(collection(db, targetCollection), data);
    alert("✅ Submission added!");
    setForm({
      type: "event",
      title: "",
      description: "",
      barName: "",
      city: "Berkeley",
      timestamp: ""
    });
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-24 pb-32 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">📣 Submit Event or Promo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="w-full p-2 text-black rounded">
            <option value="event">Event</option>
            <option value="promo">Promo</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full p-2 text-black rounded" required />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 text-black rounded" required />
        </div>

        <div>
          <label className="block mb-1 font-medium">Bar Name</label>
          <input name="barName" value={form.barName} onChange={handleChange} className="w-full p-2 text-black rounded" required />
        </div>

        <div>
          <label className="block mb-1 font-medium">City</label>
          <select name="city" value={form.city} onChange={handleChange} className="w-full p-2 text-black rounded">
            <option>Berkeley</option>
            <option>San Francisco</option>
            <option>New York</option>
            <option>Los Angeles</option>
          </select>
        </div>

        {form.type === "event" && (
          <div>
            <label className="block mb-1 font-medium">Event Time</label>
            <input
              type="datetime-local"
              name="timestamp"
              value={form.timestamp}
              onChange={handleChange}
              className="w-full p-2 text-black rounded"
              required
            />
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-white font-semibold">
          Submit
        </button>
      </form>
    </div>
  );
}
