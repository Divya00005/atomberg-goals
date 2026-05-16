import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUsers() {
  console.log("Seeding demo users...");

  // 1. Admin
  console.log("Creating Admin...");
  const { data: adminAuth, error: adminErr } = await supabase.auth.signUp({
    email: 'admin@demo.com',
    password: 'Demo@1234',
    options: { data: { full_name: 'Admin User', role: 'admin' } }
  });
  if (adminErr) console.log("Admin err:", adminErr.message);

  // 2. Manager
  console.log("Creating Manager...");
  const { data: managerAuth, error: managerErr } = await supabase.auth.signUp({
    email: 'manager@demo.com',
    password: 'Demo@1234',
    options: { data: { full_name: 'Manager User', role: 'manager' } }
  });
  if (managerErr) console.log("Manager err:", managerErr.message);

  // 3. Employee
  console.log("Creating Employee...");
  const { data: empAuth, error: empErr } = await supabase.auth.signUp({
    email: 'employee@demo.com',
    password: 'Demo@1234',
    options: { data: { full_name: 'Employee User', role: 'employee' } }
  });
  if (empErr) console.log("Employee err:", empErr.message);

  // Note: the handle_new_user trigger in Postgres will use the raw_user_meta_data->>'role'
  // to set the correct role upon creation. 
  
  // Now, link the employee to the manager
  if (managerAuth?.user && empAuth?.user) {
    console.log("Linking employee to manager...");
    
    // Login as employee to update own profile
    await supabase.auth.signInWithPassword({ email: 'employee@demo.com', password: 'Demo@1234' });
    
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ manager_id: managerAuth.user.id })
      .eq('id', empAuth.user.id);
      
    if (updateErr) console.error("Link error:", updateErr.message);
    else console.log("Employee successfully linked to Manager!");
  }

  console.log("Demo accounts created successfully.");
}

seedUsers();
