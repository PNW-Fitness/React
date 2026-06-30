import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzmmabidtkxcefffbubk.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bW1hYmlkdGt4Y2VmZmZidWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzM0NzksImV4cCI6MjA5NzQwOTQ3OX0.f7NojDEaSRyCJMabAYQ5NpC8KDJlLM_WANDHG6vArus'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
