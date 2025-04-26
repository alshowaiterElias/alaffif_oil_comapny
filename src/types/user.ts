import { Timestamp } from 'firebase/firestore'; // Adjust import based on your setup

export interface User {
  id?: string;         // Firestore document ID
  name: string;        // User's name
  email: string;       // User's email
  phone: string;       // User's phone number
  roles: string;       // User roles as a string (can be comma-separated list)
  status: "approved" | "pending" | "rejected"; // User status
  createdAt: Timestamp;     // Timestamp of user creation
  lastUpdated: Timestamp;   // Timestamp of last update
}

// Extended user interface for app context (with authentication info)
export interface AuthUser extends User {
  isAuthenticated: boolean;
}

// Interface for user requests collection
export interface UserRequest {
  id?: string;         // Firestore document ID
  name: string;        // Requester's name
  email: string;       // Requester's email
  phone: string;       // Requester's phone number
  roles: string | null;       // Requested roles as a string (can be comma-separated list)
  status: "approved" | "pending" | "rejected"; // Request status
  createdAt: Timestamp;     // Timestamp of request creation
  lastUpdated: Timestamp;   // Timestamp of last update
  userId?: string;     // Firebase auth user ID (if available)
  message?: string;    // Additional message or notes
} 