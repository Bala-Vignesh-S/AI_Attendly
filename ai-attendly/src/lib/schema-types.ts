export interface Student {
  student_id: string; // SEC23AD179
  name: string;
  register_number: string;
  year: number;
  section: string;
  mentor_id: string; // name.ai
  email: string;
  stats: {
    total_applied: number;
    approved: number;
    rejected: number;
  };
}

export interface Faculty {
  staff_id: string; // name.ai
  name: string;
  role: "mentor" | "hod" | "admin";
  email: string;
  department: string;
}

export interface ODRequest {
  od_id: string; // SEC23AD179JAN2601
  student_id: string;
  mentor_id: string;
  event_name: string;
  event_location: string;
  start_date: string; // ISO string
  end_date: string; // ISO string
  mentor_status: "pending" | "approved" | "rejected";
  hod_status: "pending" | "approved" | "rejected";
  initial_proof_url: string;
  created_at: any; // ServerTimestamp
}

export interface EventProof {
  request_id: string; // od_id
  student_id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  description: string;
  verification_status: "pending" | "verified" | "flagged";
  uploaded_at: any;
}

export interface YearLimit {
  year: number;
  limit: number;
}
