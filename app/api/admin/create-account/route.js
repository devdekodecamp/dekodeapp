import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resendApiKey = process.env.RESEND_API_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for admin create-account route')
}

const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Log initialization status (only once when module loads)
if (!resendApiKey) {
  // eslint-disable-next-line no-console
  console.warn('[CREATE ACCOUNT] RESEND_API_KEY is not set in environment variables')
} else {
  // eslint-disable-next-line no-console
  console.log('[CREATE ACCOUNT] Resend client initialized successfully')
}

export async function POST(request) {
  // eslint-disable-next-line no-console
  console.log('[CREATE ACCOUNT] POST request received')
  
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured on the server' },
        { status: 500 },
      )
    }

    const { email, password, name, role = 'user' } = await request.json()
    
    // eslint-disable-next-line no-console
    console.log('[CREATE ACCOUNT] Creating account for:', { email, name, role })

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    })

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create user in Supabase' },
        { status: 400 },
      )
    }

    const user = data.user

    // Optionally mirror basic info into a public `profiles` table if it exists.
    // This will no-op if the table is missing (e.g. error code 42P01).
    try {
      await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            name,
            role,
          },
          { onConflict: 'id' },
        )
    } catch (profileErr) {
      // eslint-disable-next-line no-console
      console.warn('Failed to upsert into profiles table (this may be expected if it does not exist):', profileErr)
    }

    // Send welcome email with login credentials
    let emailSent = false
    let emailErrorMessage = null
    
    // eslint-disable-next-line no-console
    console.log('[CREATE ACCOUNT] Attempting to send email. Resend client exists:', !!resend)
    // eslint-disable-next-line no-console
    console.log('[CREATE ACCOUNT] RESEND_API_KEY exists:', !!resendApiKey)
    
    if (resend) {
      try {
        // Get the base URL for the login page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        
        const loginUrl = `${baseUrl}/`

        // eslint-disable-next-line no-console
        console.log('[CREATE ACCOUNT] Sending email to:', email, 'from noreply@dekodecamp.com')
        
        // Create plain text version for better deliverability
        const textVersion = `
Welcome, ${name}!

Your account has been successfully created for DekodeCamp. You can now access the platform using the credentials below:

Email: ${email}
Temporary Password: ${password}

Login URL: ${loginUrl}

IMPORTANT: Please change your temporary password after logging in for security purposes.

If you have any questions, please contact support at support@dekodecamp.com.

Best regards,
The DekodeCamp Team
        `.trim()

        const emailResult = await resend.emails.send({
          from: 'DekodeCamp <noreply@dekodecamp.com>',
          to: [email],
          subject: 'Welcome to DekodeCamp - Your Account Has Been Created',
          replyTo: 'support@dekodecamp.com',
          text: textVersion,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 40px 40px 30px; background-color: #4F46E5; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to DekodeCamp</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
                            Hello ${name},
                          </p>
                          
                          <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Your account has been successfully created. You can now access the DekodeCamp platform using the credentials below:
                          </p>
                          
                          <!-- Credentials Box -->
                          <table role="presentation" style="width: 100%; margin: 30px 0; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <tr>
                              <td style="padding: 20px;">
                                <p style="margin: 0 0 10px; color: #111827; font-size: 14px; font-weight: 600;">Email Address:</p>
                                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; font-family: monospace;">${email}</p>
                                
                                <p style="margin: 0 0 10px; color: #111827; font-size: 14px; font-weight: 600;">Temporary Password:</p>
                                <p style="margin: 0; color: #374151; font-size: 16px; font-family: monospace;">${password}</p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- CTA Button -->
                          <table role="presentation" style="width: 100%; margin: 30px 0;">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${loginUrl}" 
                                   style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                  Login to Your Account
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Security Notice -->
                          <div style="margin: 30px 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                            <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600; line-height: 1.5;">
                              🔒 Security Notice: Please change your temporary password immediately after logging in for security purposes.
                            </p>
                          </div>
                          
                          <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.
                          </p>
                          
                          <p style="margin: 20px 0 0; color: #111827; font-size: 16px; line-height: 1.6;">
                            Best regards,<br>
                            <strong>The DekodeCamp Team</strong>
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                            This is an automated message. Please do not reply directly to this email.
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            © ${new Date().getFullYear()} DekodeCamp. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        })
        
        // eslint-disable-next-line no-console
        console.log('[CREATE ACCOUNT] Email sent successfully:', JSON.stringify(emailResult, null, 2))
        // eslint-disable-next-line no-console
        console.log('[CREATE ACCOUNT] Email ID:', emailResult?.data?.id)
        emailSent = true
      } catch (emailError) {
        // eslint-disable-next-line no-console
        console.error('[CREATE ACCOUNT] Failed to send welcome email:', emailError)
        // eslint-disable-next-line no-console
        console.error('[CREATE ACCOUNT] Email error details:', JSON.stringify(emailError, null, 2))
        // Don't fail the request if email fails - account was created successfully
        emailErrorMessage = emailError?.message || 'Email send failed'
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('[CREATE ACCOUNT] Resend API key is missing; welcome email was not sent')
      emailErrorMessage = 'RESEND_API_KEY not configured'
    }
    
    // eslint-disable-next-line no-console
    console.log('[CREATE ACCOUNT] Account creation complete. Email sent:', emailSent, 'Error:', emailErrorMessage)

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name,
        role,
        emailSent,
        emailError: emailErrorMessage,
      },
      { status: 201 },
    )
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Admin create account error', err)
    return NextResponse.json({ error: 'Unexpected error while creating account' }, { status: 500 })
  }
}
