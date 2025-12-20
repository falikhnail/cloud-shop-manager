import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { username } = await req.json()
    const cleanUsername = String(username ?? '').trim()

    if (!cleanUsername) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username diperlukan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find user by username (name field in profiles)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, user_id, name')
      .ilike('name', cleanUsername)
      .maybeSingle()

    if (profileError || !profile) {
      console.log('Profile not found for username:', cleanUsername)
      // Return success even if not found for security (don't reveal if user exists)
      return new Response(
        JSON.stringify({ success: true, message: 'Jika username ditemukan, email reset password akan dikirim' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.user_id) {
      console.log('User has no auth account:', cleanUsername)
      return new Response(
        JSON.stringify({ success: true, message: 'Jika username ditemukan, email reset password akan dikirim' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a temporary password
    const tempPassword = generateTempPassword()

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Gagal mereset password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Send email with temporary password
    const resend = new Resend(resendApiKey)

    const { error: emailError } = await resend.emails.send({
      from: 'VapeStore POS <onboarding@resend.dev>',
      to: [profile.email],
      subject: 'Reset Password - VapeStore POS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Reset Password</h1>
          <p>Halo <strong>${profile.name}</strong>,</p>
          <p>Password Anda telah direset. Berikut adalah password sementara Anda:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Username:</strong> ${profile.name}</p>
            <p style="margin: 5px 0;"><strong>Password Sementara:</strong> <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
          </div>
          <p style="color: #666;">Silakan login dan segera ubah password Anda setelah masuk.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">Email ini dikirim otomatis. Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      // Password already reset, but email failed - log but return success
      return new Response(
        JSON.stringify({ success: true, message: 'Password telah direset. Hubungi admin untuk mendapatkan password baru.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Password reset email sent to:', profile.email)

    return new Response(
      JSON.stringify({ success: true, message: 'Email reset password telah dikirim' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in reset-password function:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
