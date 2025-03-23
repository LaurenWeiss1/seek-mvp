import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function BulkBarUploader() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    const lines = input.split("\n").filter(Boolean);
    const entries = lines.map((line) => {
      const [name, city, latitude, longitude] = line.split(",").map((s) => s.trim());
      return { name, city, latitude, longitude };
    });

    try {
      for (const entry of entries) {
        if (entry.name && entry.city && entry.latitude && entry.longitude) {
          await addDoc(collection(db, "bars"), {
            name: entry.name,
            city: entry.city,
            latitude: parseFloat(entry.latitude),
            longitude: parseFloat(entry.longitude),
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
      <textarea
        rows={10}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="One bar per line, format: Bar Name, City, Latitude, Longitude"
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
