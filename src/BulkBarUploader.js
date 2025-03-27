import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function BulkBarUploader() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    const lines = input.split("\n").filter(Boolean);
    const entries = lines.map((line) => {
      const [name, city, state, lat, lng] = line.split(",").map((s) => s.trim());
      return { name, city, state, latitude: parseFloat(lat), longitude: parseFloat(lng) };
    });

    try {
      for (const entry of entries) {
        if (entry.name && entry.city && !isNaN(entry.latitude) && !isNaN(entry.longitude)) {
          await addDoc(collection(db, "bars"), {
            name: entry.name,
            city: entry.city,
            state: entry.state || "",
            latitude: entry.latitude,
            longitude: entry.longitude,
            createdAt: serverTimestamp(),
          });
        }
      }
      setStatus("✅ Bars uploaded successfully!");
      setInput("");
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("❌ Failed to upload bars.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Bulk Bar Uploader</h2>
      <p className="mb-2 text-sm text-gray-500">
        Format: <code>Bar Name, City, State, Latitude, Longitude</code>
      </p>
      <textarea
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Example: Spats, Berkeley, CA, 37.8715, -122.2730"
        className="w-full border p-2 mb-3"
      ></textarea>
      <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">
        Upload Bars
      </button>
      {status && <p className="mt-3">{status}</p>}
    </div>
  );
}

export default BulkBarUploader;
