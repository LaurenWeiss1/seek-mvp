// useBars.js
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const useBars = () => {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const snapshot = await getDocs(collection(db, "bars"));
        const barNames = snapshot.docs.map((doc) => doc.data().name).filter(Boolean);
        const uniqueBars = [...new Set(barNames)]; // remove duplicates
        uniqueBars.sort();
        setBars(uniqueBars);

      } catch (err) {
        console.error("Failed to fetch bars:", err);
      }
    };

    fetchBars();
  }, []);

  return bars;
};

export default useBars;
