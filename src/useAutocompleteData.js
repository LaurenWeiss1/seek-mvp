// useAutocompleteData.js
import { useEffect, useState } from "react";

const useAutocompleteData = (sheetUrl) => {
  const [data, setData] = useState({
    hometowns: [],
    states: [],
    countries: [],
    colleges: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(sheetUrl);
        const text = await res.text();
        const rows = text.split("\n").map((row) => row.split(","));

        const columns = rows[0].map((col) => col.trim().toLowerCase());
        const indexes = {
          hometowns: columns.indexOf("hometowns"),
          states: columns.indexOf("states"),
          countries: columns.indexOf("countries"),
          colleges: columns.indexOf("colleges"),
        };

        const parsed = {
          hometowns: [],
          states: [],
          countries: [],
          colleges: [],
        };

        for (let i = 1; i < rows.length; i++) {
          if (indexes.hometowns !== -1) parsed.hometowns.push(rows[i][indexes.hometowns]?.trim());
          if (indexes.states !== -1) parsed.states.push(rows[i][indexes.states]?.trim());
          if (indexes.countries !== -1) parsed.countries.push(rows[i][indexes.countries]?.trim());
          if (indexes.colleges !== -1) parsed.colleges.push(rows[i][indexes.colleges]?.trim());
        }

        // Remove empty values
        Object.keys(parsed).forEach((key) => {
          parsed[key] = parsed[key].filter(Boolean);
        });

        setData(parsed);
      } catch (err) {
        console.error("Failed to fetch autocomplete data", err);
      }
    };

    fetchData();
  }, [sheetUrl]);

  return data;
};

export default useAutocompleteData;
