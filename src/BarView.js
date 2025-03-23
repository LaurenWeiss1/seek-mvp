import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";

function BarView() {
  const { barName } = useParams();
  const [checkIns, setCheckIns] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  // Filters
  const [genderFilter, setGenderFilter] = useState("");
  const [sexualityFilter, setSexualityFilter] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "checkins"),
      where("bar", "==", barName),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setCheckIns(data);
    });

    return () => unsubscribe();
  }, [barName]);

  // Apply filters
  useEffect(() => {
    let results = checkIns;

    if (genderFilter) {
      results = results.filter((p) =>
        p.gender?.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    if (sexualityFilter) {
      results = results.filter((p) =>
        p.sexuality?.toLowerCase() === sexualityFilter.toLowerCase()
      );
    }

    if (ageMin) {
      results = results.filter((p) => parseInt(p.age) >= parseInt(ageMin));
    }

    if (ageMax) {
      results = results.filter((p) => parseInt(p.age) <= parseInt(ageMax));
    }

    setFilteredResults(results);
  }, [checkIns, genderFilter, sexualityFilter, ageMin, ageMax]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Who's at {barName}</h2>

      <div style={{ marginBottom: 20 }}>
        <label>Filter by Gender:</label><br />
        <input
          type="text"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          placeholder="e.g. woman"
        /><br />

        <label>Filter by Sexuality:</label><br />
        <input
          type="text"
          value={sexualityFilter}
          onChange={(e) => setSexualityFilter(e.target.value)}
          placeholder="e.g. queer, straight, gay"
        /><br />

        <label>Filter by Age Range:</label><br />
        <input
          type="number"
          value={ageMin}
          onChange={(e) => setAgeMin(e.target.value)}
          placeholder="Min age"
        />
        <input
          type="number"
          value={ageMax}
          onChange={(e) => setAgeMax(e.target.value)}
          placeholder="Max age"
          style={{ marginLeft: 10 }}
        />
      </div>

      {filteredResults.map((person, index) => (
        <div
          key={index}
          style={{
            marginBottom: 10,
            border: "1px solid #ccc",
            padding: 10,
            borderRadius: 5
          }}
        >
          <p><strong>Name:</strong> {person.name || "Anonymous"}</p>
          <p><strong>Age:</strong> {person.age}</p>
          <p><strong>Gender:</strong> {person.gender}</p>
          <p><strong>Sexuality:</strong> {person.sexuality}</p>
          <p><strong>Hometown:</strong> {person.hometown}</p>
        </div>
      ))}
    </div>
  );
}

export default BarView;
