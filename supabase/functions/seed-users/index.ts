import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const usersToCreate = [
      { email: 'admin@vapestore.com', password: 'admin123', name: 'admin', role: 'admin' },
      { email: 'kasir@vapestore.com', password: 'kasir123', name: 'kasir', role: 'kasir' },
    ]

    const results: { user: string; status: string; id?: string; error?: string }[] = []

    for (const user of usersToCreate) {
      console.log(`Processing user: ${user.name}`)

      // Check if auth user already exists
      const { data: allUsers } = await supabase.auth.admin.listUsers()
      const existingAuthUser = allUsers?.users?.find(u => u.email === user.email)

      if (existingAuthUser) {
        console.log(`Auth user ${user.email} already exists, ensuring role is set`)
        
        // Ensure profile exists
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: existingAuthUser.id,
            name: user.name,
            email: user.email,
          }, { onConflict: 'user_id' })

        if (profileError) {
          console.error('Profile upsert error:', profileError)
        }

        // Ensure role exists in user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: existingAuthUser.id,
            role: user.role,
          }, { onConflict: 'user_id,role' })

        if (roleError) {
          console.error('Role upsert error:', roleError)
        }

        results.push({ user: user.name, status: 'exists - ensured role', id: existingAuthUser.id })
        continue
      }

      // Create new auth user
      console.log(`Creating auth user: ${user.email}`)
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
        },
      })

      if (createError) {
        console.error(`Error creating user ${user.email}:`, createError)
        results.push({ user: user.name, status: 'auth error', error: createError.message })
        continue
      }

      const userId = created.user?.id
      if (!userId) {
        results.push({ user: user.name, status: 'error', error: 'Missing user id' })
        continue
      }

      console.log(`Created auth user ${user.email} with id ${userId}`)

      // Profile is created by handle_new_user trigger with default 'kasir' role.
      // Override role if admin.
      if (user.role === 'admin') {
        // Delete existing kasir role if any and insert admin
        await supabase.from('user_roles').delete().eq('user_id', userId)

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' })

        if (roleError) {
          console.error('Role insert error:', roleError)
          results.push({ user: user.name, status: 'created - role error', id: userId, error: roleError.message })
        } else {
          results.push({ user: user.name, status: 'created with admin role', id: userId })
        }
      } else {
        results.push({ user: user.name, status: 'created with default kasir role', id: userId })
      }
    }

    console.log('Seed results:', results)

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Seed users error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
