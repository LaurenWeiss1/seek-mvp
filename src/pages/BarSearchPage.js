import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Papa from "papaparse";

const bayAreaCities = ["San Francisco", "Berkeley", "Oakland", "Palo Alto"];

const cityBarDataSources = {
  Berkeley: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1529534222&single=true&output=csv",
  "San Francisco": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=1713497672&single=true&output=csv",
  Oakland: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3JWZ57czLyQw2Ax517LfV9a8H15xkvdbXPiPk4SFUogpwG51kZ7-xj2bhtuRN7VO2JQjl-qPHLi5X/pub?gid=498638698&single=true&output=csv",
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
            const name = (row.bar || row["bar name"] || row.Bar || row["Bar Name"] || "").trim();
            if (!name) return null;

            // Multi-type parse: separated by ";"
            // e.g., "Sports Bar; Dive Bar; College"
            const rawType = (row.type || row.Type || row["bar type"] || row["Bar Type"] || "").trim();
            const types = rawType
              ? rawType.split(";").map(t => t.trim()).filter(Boolean)
              : ["Cocktail bar"]; // default if blank

            return { name, type: rawType || "Cocktail bar", types };
          })
          .filter(Boolean);

        setBars(cleanedBars);

        const typeSet = new Set();
        cleanedBars.forEach(bar => bar.types.forEach(t => typeSet.add(t)));
        const uniqueTypes = Array.from(typeSet).sort();

        setAllTypes(uniqueTypes);
        setSelectedTypes(uniqueTypes); // show all by default
      }
    });
  }, [selectedCity]);

  const filteredBars = bars
    .filter(bar => bar.types.some(t => selectedTypes.includes(t)))
    .filter(bar => bar.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const seeAllBars = () => {
    setSelectedTypes(allTypes);
    setSearchTerm("");
  };

  const openBar = (barName) => {
    if (!barName) return;
    if (selectedCity) localStorage.setItem('selectedCity', selectedCity);
    navigate(`/barview/${encodeURIComponent(barName)}`, {
      state: { city: selectedCity || localStorage.getItem('selectedCity') || '' }
    });
  };

  return (
    <div className="px-4 pt-4 pb-20 text-white">
      <h1 className="text-2xl font-bold mb-4">Search Bars</h1>

      {/* City Selector */}
      <Select
        options={bayAreaCities.map(c => ({ label: c, value: c }))}
        value={selectedCity ? { label: selectedCity, value: selectedCity } : null}
        onChange={selected => {
          const city = selected?.value || null;
          setSelectedCity(city);
          if (city) localStorage.setItem('selectedCity', city);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition"
            >
              {showFilters ? "Hide Filters" : "Filter by Type"}
            </button>

            {/* See all bars button */}
            <button
              onClick={seeAllBars}
              disabled={allTypes.length === 0}
              className="px-4 py-2 rounded-lg border border-white/20 bg-blue-500/80 hover:bg-blue-500 transition disabled:opacity-50"
              title="Show every bar regardless of type and clear search"
            >
              See all bars
            </button>
          </div>

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
              key={`${bar.name}-${index}`}
              onClick={() => openBar(bar.name)}
              className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openBar(bar.name)}
            >
              <h2 className="text-lg font-semibold">{bar.name}</h2>
              <p className="text-sm text-gray-300">{bar.types.join(", ")}</p>
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
