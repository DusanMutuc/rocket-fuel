// src/types/Client.ts
export interface Client {
    client_id: string;         // Unique identifier for the client
    user_id: string;           // Foreign key referencing the user (agent) who owns this client
    first_name: string;        // Client's first name (required)
    last_name?: string;        // Client's last name (optional)
    email?: string;            // Client's email (optional)
    phone_number?: string;     // Client's phone number (optional)
    address?: string;          // Client's address (optional)
    is_in_pipeline: boolean;   // Whether the client is currently in the 15/30 pipeline
    temperature: 'none' | 'lukewarm' | 'warm' | 'hot';  // Temperature status as an enum
    pipeline_note?: string;    // Note for clients in the pipeline
    prospect_note?: string;    // Note for clients in the prospect list
    original_contact: string;        // ISO string or Date representing when the client was created
    created_at: string;        // ISO string or Date representing when the client was created
    pipeline_revenue: number;
}
