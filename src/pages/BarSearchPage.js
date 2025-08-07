import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Papa from "papaparse";

const bayAreaCities = ["San Francisco", "Berkeley", "Oakland", "Palo Alto"];

const cityBarDataSources = {
  Berkeley: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1529534222&single=true&output=csv",
  "San Francisco": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1713497672&single=true&output=csv",
  Oakland: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=498638698&single=true&output=csv",
  //Marin: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=447070284&single=true&output=csv",
  "Palo Alto": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=543562265&single=true&output=csv"
};

function BarSearchPage() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [bars, setBars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedCity || !cityBarDataSources[selectedCity]) return;

    Papa.parse(cityBarDataSources[selectedCity], {
      download: true,
      header: true,
      complete: (results) => {
        const cleanedBars = results.data
          .map(row => {
            const name = row.bar?.trim();
            const type = row.type?.trim() || "Cocktail bar";
            return name ? { name, type } : null;
          })
          .filter(Boolean);

        setBars(cleanedBars);

        const uniqueTypes = Array.from(
          new Set(cleanedBars.map(bar => bar.type))
        ).sort();
        setAllTypes(uniqueTypes);
        setSelectedTypes(uniqueTypes); // show all by default
      }
    });
  }, [selectedCity]);

  const filteredBars = bars
    .filter(bar => selectedTypes.includes(bar.type))
    .filter(bar => bar.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="px-4 pt-4 pb-20 text-white">
      <h1 className="text-2xl font-bold mb-4">Search Bars</h1>

      {/* City Selector */}
      <Select
        options={bayAreaCities.map(c => ({ label: c, value: c }))}
        value={selectedCity ? { label: selectedCity, value: selectedCity } : null}
        onChange={selected => {
          setSelectedCity(selected.value);
          setSearchTerm("");
        }}
        placeholder="Select a city"
        isClearable
        styles={{
          control: base => ({ ...base, backgroundColor: "#1f2937", borderColor: "#374151", color: "white" }),
          input: base => ({ ...base, color: "white" }),
          singleValue: base => ({ ...base, color: "white" }),
          menu: base => ({ ...base, backgroundColor: "#1f2937", color: "white" }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#A1C5E6" : "#1f2937",
            color: state.isFocused ? "#0b0d12" : "white",
            cursor: "pointer",
          }),
        }}
      />

      {/* Search Input */}
      {selectedCity && (
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search for a bar..."
          className="w-full mt-4 p-3 rounded-xl bg-white/10 border border-white/20 text-white"
        />
      )}

      {/* Filter Toggle */}
      {selectedCity && (
        <div className="mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition"
          >
            {showFilters ? "Hide Filters" : "Filter by Type"}
          </button>

          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {allTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    selectedTypes.includes(type)
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-white border-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bar Results */}
      {selectedCity && (
        <div className="mt-6 space-y-4">
          {filteredBars.map((bar, index) => (
            <div
              key={index}
              onClick={() => navigate(`/bar/${bar.name}`)}
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition cursor-pointer"
            >
              <h2 className="text-lg font-semibold">{bar.name}</h2>
              <p className="text-sm text-gray-300">{bar.type}</p>
            </div>
          ))}
          {filteredBars.length === 0 && (
            <p className="text-gray-400 text-center mt-8">No bars found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BarSearchPage;
