import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase Project URL & Anon Key
const SUPABASE_URL = 'https://cqlkhkrksvnjorriroyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGtoa3Jrc3Zuam9ycmlyb3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTY1OTIsImV4cCI6MjA1NDg5MjU5Mn0.BSNkA1A6UT3JRfZGtuN7-4pZS2eLGDYdCp6xg3vm0aw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
