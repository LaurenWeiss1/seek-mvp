import React from "react";
import { useNavigate } from "react-router-dom";

function CheckInCityBayAreaOnly() {
  const navigate = useNavigate();

  const bayAreaCities = [
    "San Francisco",
    "Berkeley",
    "Oakland",
    "Palo Alto",
    // "Marin"
  ];

  const handleSelectCity = (city) => {
    localStorage.setItem("selectedCity", city);
    navigate(`/checkin?city=${encodeURIComponent(city)}`);
  };

  return (
    <div
      className="relative text-white h-screen w-screen flex flex-col items-center justify-center text-center"
      style={{
        backgroundColor: "#0b0d12",
        backgroundImage: "url('/custom-grid.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative space-y-6 max-w-md z-10">
        <h1 className="text-4xl font-bold">Which city are you in?</h1>
        <div className="flex flex-col gap-4 mt-6">
          {bayAreaCities.map((city) => (
            <button
              key={city}
              onClick={() => handleSelectCity(city)}
              className="py-3 px-6 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg"
              style={{
                backgroundColor: "#A1C5E6",
                color: "#0b0d12",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#90B8DE")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#A1C5E6")
              }
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CheckInCityBayAreaOnly;
