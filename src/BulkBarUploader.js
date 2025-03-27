import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";

function BulkBarUploader() {
  const [csvText, setCsvText] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        let successCount = 0;

        for (const row of data) {
          const { name, city, state, latitude, longitude } = row;
          if (name && city) {
            try {
              await addDoc(collection(db, "bars"), {
                name: name.trim(),
                city: city.trim(),
                state: state?.trim() || "",
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                createdAt: serverTimestamp(),
              });
              successCount++;
            } catch (err) {
              console.error("Error uploading bar:", err);
            }
          }
        }

        setStatus(`✅ Uploaded ${successCount} bars successfully!`);
      },
      error: (error) => {
        console.error("CSV Parsing error:", error);
        setStatus("❌ Failed to parse CSV.");
      },
    });
  };

  const debounceTimer = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setCsvText(value);
    }, 300); // Delay text parsing for 300ms to avoid flooding updates
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Bulk Bar Uploader</h2>
      <p className="text-sm text-gray-400 mb-2">
        Paste your CSV content below. Required columns: <code>name</code>, <code>city</code>. Optional: <code>state</code>, <code>latitude</code>, <code>longitude</code>
      </p>
      <textarea
        rows={10}
        defaultValue={csvText}
        onChange={handleChange}
        placeholder="name,city,state,latitude,longitude"
        className="w-full border border-gray-400 p-2 rounded mb-4"
      ></textarea>
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload Bars
      </button>
      {status && <p className="mt-3 text-sm font-medium">{status}</p>}
    </div>
  );
}

export default BulkBarUploader;
