// src/seedTestCheckins.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const sampleCheckins = [
  {
    name: "Alex",
    age: 26,
    gender: "Transgender",
    sexuality: "Lesbian",
    bar: "Tupper & Reed",
    barId: "tupper-reed",
    city: "Berkeley",
    lat: 37.8693,
    lng: -122.2595,
  },
  {
    name: "Jordan",
    age: 26,
    gender: "Man",
    sexuality: "Gay",
    bar: "Cornerstone",
    barId: "cornerstone",
    city: "Berkeley",
    lat: 37.8696,
    lng: -122.2670,
  },
  {
    name: "Morgan",
    age: 31,
    gender: "Woman",
    sexuality: "Gay",
    bar: "Cornerstone",
    barId: "cornerstone",
    city: "Berkeley",
    lat: 37.8696,
    lng: -122.2670,
  },
  {
    name: "Jordan",
    age: 35,
    gender: "Woman",
    sexuality: "Lesbian",
    bar: "Tupper & Reed",
    barId: "tupper-reed",
    city: "Berkeley",
    lat: 37.8693,
    lng: -122.2595,
  },
  {
    name: "Jordan",
    age: 31,
    gender: "Man",
    sexuality: "Pansexual",
    bar: "Spats",
    barId: "spats",
    city: "Berkeley",
    lat: 37.8695,
    lng: -122.2674,
  }
];

export const seedTestCheckins = async () => {
  const promises = sampleCheckins.map((checkin) =>
    addDoc(collection(db, "checkins"), {
      ...checkin,
      timestamp: serverTimestamp(),
    })
  );
  await Promise.all(promises);
  console.log("✅ Seeded test check-ins");
};
