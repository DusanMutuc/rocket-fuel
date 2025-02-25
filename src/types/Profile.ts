// src/types/Profile.ts
export interface Profile {
    user_id: string;           // Should match the ID from the auth.users table
    first_name: string;        // Required first name
    last_name: string;        // Optional last name, if not provided
    age?: number;              // Optional age
    // You can add additional fields here as needed, e.g., phone number, address, etc.
}
