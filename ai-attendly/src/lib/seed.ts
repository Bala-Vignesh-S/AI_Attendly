import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

export const seedInitialData = async (uid: string, username: string, name: string) => {
  const role = (username === "admin.ai" || username === "balavignesh.ai") ? "admin" : (username.endsWith(".ai") ? (username === "hod.ai" ? "hod" : "mentor") : "student");
  
  // Custom Domain Logic
  let email = username;
  if (!username.includes("@")) {
    if (username === "admin.ai" || username === "balavignesh.ai") email = `${username.toLowerCase()}@gmail.com`;
    else if (username.endsWith(".ai")) email = `${username.toLowerCase()}@sairam.edu.in`;
    else email = `${username.toLowerCase()}@sairamtap.edu.in`;
  }
  
  // Create User Profile
  await setDoc(doc(db, "users", uid), {
    uid,
    username,
    role,
    name,
    email
  });

  // If student, create student detailed doc
  if (role === "student") {
    await setDoc(doc(db, "students", username), {
      student_id: username,
      name,
      register_number: "REG" + Math.floor(Math.random() * 1000000),
      year: 2,
      section: "B",
      mentor_id: "jeena.ai",
      email,
      stats: { total_applied: 0, approved: 0, rejected: 0 }
    });
  }

  // Seed default year limits if not exist
  const yearLimitsRef = collection(db, "year_limits");
  const snap = await getDocs(query(yearLimitsRef, limit(1)));
  if (snap.empty) {
    const limits = [
      { year: 1, limit: 20 },
      { year: 2, limit: 25 },
      { year: 3, limit: 30 },
      { year: 4, limit: 35 },
    ];
    for (const l of limits) {
      await setDoc(doc(db, "year_limits", String(l.year)), l);
    }
  }
};
