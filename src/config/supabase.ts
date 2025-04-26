import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnsgqvtgrbgcjvteskcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc2dxdnRncmJnY2p2dGVza2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjA2MzQsImV4cCI6MjA2MDczNjYzNH0.0IH0zIdo4IV_BibHyer89eZBla_wxLUQVNmnh-H1Yjc';
const bucketName = 'alaffif-waste-oil';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { bucketName }; 