import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lnfzvpaonuzbcnlulyyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZnp2cGFvbnV6YmNubHVseXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU3MDcsImV4cCI6MjA3Mzc3MTcwN30.031UwVA_BNJTAvEVbjhSjzVmfLmD2hSpXZl8flSy1cw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'stas@abedward.com',
    password: '414Mercantile',
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } else {
    console.log('User created successfully!');
    console.log('Email:', data.user?.email);
    console.log('User ID:', data.user?.id);
    process.exit(0);
  }
}

createUser();
