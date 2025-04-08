import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const sampleCheckins = [
  {
    name: "Alex",
    age: 26,
    gender: "Transgender",
    sexuality: "Lesbian",
    bar: "Tupper & Reed",
    city: "Berkeley",
  },
  {
    name: "Jordan",
    age: 26,
    gender: "Man",
    sexuality: "Gay",
    bar: "Cornerstone",
    city: "Berkeley",
  },
  {
    name: "Morgan",
    age: 31,
    gender: "Woman",
    sexuality: "Gay",
    bar: "Cornerstone",
    city: "Berkeley",
  },
  {
    name: "Jordan",
    age: 35,
    gender: "Woman",
    sexuality: "Lesbian",
    bar: "Tupper & Reed",
    city: "Berkeley",
  },
  {
    name: "Jordan",
    age: 31,
    gender: "Man",
    sexuality: "Pansexual",
    bar: "Spats",
    city: "Berkeley",
  },
];

export const seedTestCheckins = async () => {
  const promises = sampleCheckins.map((checkin) =>
    addDoc(collection(db, "checkins"), {
      ...checkin,
      timestamp: serverTimestamp(),
    })
  );
  await Promise.all(promises);
};
