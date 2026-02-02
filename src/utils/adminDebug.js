
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Validates the admin setup by attempting to login and checking RLS permissions.
 * This function logs detailed results to the console.
 */
export const validateAdminSetup = async () => {
  console.group('🔍 Admin Setup Validation');
  const results = {
    step1_login: 'PENDING',
    step2_rls_write: 'PENDING',
    step3_rls_read: 'PENDING',
    user: null,
    errors: []
  };

  try {
    // 1. Test Login
    console.log('1️⃣ Attempting login with quelia@admin.fr...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'quelia@admin.fr',
      password: 'admin'
    });

    if (authError) {
      console.error('❌ Login failed:', authError);
      results.step1_login = 'FAILED';
      results.errors.push(`Login failed: ${authError.message}`);
      throw new Error('Authentication failed - cannot proceed with RLS checks.');
    } else {
      console.log('✅ Login successful:', authData.user);
      results.step1_login = 'SUCCESS';
      results.user = authData.user;
    }

    // 2. Test RLS Write (Insert)
    console.log('2️⃣ Testing RLS: Can we insert a project?');
    const dummyProject = {
      name: 'Test Project ' + new Date().toISOString(),
      type: 'Test',
      status: 'en étude',
      city: 'Test City',
      latitude: 48.8566,
      longitude: 2.3522,
      description: 'Temporary test record for RLS validation'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert(dummyProject)
      .select()
      .single();

    if (insertError) {
      console.error('❌ RLS Write Check Failed:', insertError);
      results.step2_rls_write = 'FAILED';
      results.errors.push(`RLS Write failed: ${insertError.message}`);
    } else {
      console.log('✅ RLS Write Check Successful. Record ID:', insertData.id);
      results.step2_rls_write = 'SUCCESS';

      // Cleanup: Delete the test record
      const { error: deleteError } = await supabase.from('projects').delete().eq('id', insertData.id);
      if (deleteError) console.warn('⚠️ Could not clean up test record:', deleteError);
    }

    // 3. Test Public Read (Implicitly done if map loads, but explicit check here)
    console.log('3️⃣ Testing RLS: Public Read Access');
    const { count, error: readError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (readError) {
       console.error('❌ RLS Read Check Failed:', readError);
       results.step3_rls_read = 'FAILED';
    } else {
       console.log(`✅ RLS Read Check Successful. Found ${count} projects.`);
       results.step3_rls_read = 'SUCCESS';
    }

  } catch (e) {
    console.error('⚠️ Validation script error:', e);
    results.errors.push(e.message);
  }

  console.log('📋 Final Validation Results:', results);
  console.groupEnd();
  
  return results;
};
