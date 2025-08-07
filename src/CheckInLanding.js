import { useState } from "react";
import CheckInCityBayAreaOnly from "./CheckInCityBayAreaOnly";

function CheckInLanding({ onComplete }) {
  const [started, setStarted] = useState(false);

  if (started) {
    // Show check-in flow
    return <CheckInCityBayAreaOnly onComplete={onComplete} />;
  }

  return (
    <div
      className="relative min-h-screen text-white flex flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundColor: "#0b0d12",
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative space-y-6 max-w-md z-10">
        <h1 className="text-5xl font-extrabold leading-tight">
          Welcome to{" "}
          <span style={{ color: "#A1C5E6" }}>
            Seek
          </span>{" "}
          👋
        </h1>
        <p className="text-gray-200 text-lg">
          Discover who’s out and about. Check in and connect at real venues in
          your city.
        </p>

        <button
          onClick={() => setStarted(true)}
          className="inline-block font-semibold py-3 px-8 rounded-xl transition transform hover:scale-105 shadow-lg"
          style={{
            backgroundColor: "#A1C5E6",
            color: "#0b0d12",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#90B8DE")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#A1C5E6")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default CheckInLanding;
