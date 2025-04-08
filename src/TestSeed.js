import React from "react";
import { seedTestCheckins } from "./SeedTestUsers";

export default function TestSeed() {
  const handleSeed = async () => {
    try {
      await seedTestCheckins();
      alert("✅ Seeded test check-ins!");
    } catch (err) {
      console.error("Seeding failed", err);
      alert("❌ Failed to seed data.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <button
        onClick={handleSeed}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold shadow"
      >
        Seed Test Check-Ins
      </button>
    </div>
  );
}
