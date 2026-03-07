import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type UserRole = "student" | "mentor" | "hod" | "admin";

export interface UserProfile {
  uid: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
}

export const detectRoleFromUsername = (username: string): "student" | "staff" => {
  if (username.toLowerCase().endsWith(".ai")) return "staff";
  if (username.toUpperCase().startsWith("SEC")) return "student";
  throw new Error("Invalid username format. Use name.ai for staff or SEC... for students.");
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};
