import { useState } from "react";

function AutocompleteInput({ label, name, value, onChange, options }) {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(e); // update the formData in parent
    const matches = options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(matches);
    setShowSuggestions(true);
  };

  const handleSelect = (option) => {
    // Create a synthetic event to match how handleChange works
    const fakeEvent = {
      target: {
        name,
        value: option,
      },
    };
    onChange(fakeEvent);
    setFilteredOptions([]);
    setShowSuggestions(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label>{label}:</label><br />
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        autoComplete="off"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        style={{ width: "100%" }}
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <ul
          style={{
            border: "1px solid #ccc",
            margin: 0,
            padding: 0,
            listStyle: "none",
            backgroundColor: "#fff",
            maxHeight: 150,
            overflowY: "auto",
            position: "relative",
            zIndex: 10,
          }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onMouseDown={() => handleSelect(option)} // use onMouseDown to avoid blur hiding before select
              style={{
                padding: "8px 10px",
                cursor: "pointer",
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AutocompleteInput;
