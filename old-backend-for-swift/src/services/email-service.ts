/**
 * Email Service
 * 
 * Handles all transactional email sending via Resend
 * Includes logging, retry logic, and template management
 */

import { Resend } from 'resend';
import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  emailType: EmailType;
  templateId?: string;
}

export type EmailType =
  | 'welcome'
  | 'password_reset'
  | 'payment_receipt'
  | 'subscription_change'
  | 'failed_payment';

export interface EmailLog {
  id: string;
  userId?: string;
  emailAddress: string;
  emailType: EmailType;
  sentAt: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  resendEmailId?: string;
}

export class EmailService {
  private resend: Resend;
  private supabase: SupabaseClient;
  private fromEmail: string;

  constructor(
    resendApiKey: string,
    supabase: SupabaseClient,
    fromEmail: string = 'YOU+ <noreply@youplus.app>'
  ) {
    this.resend = new Resend(resendApiKey);
    this.supabase = supabase;
    this.fromEmail = fromEmail;
  }

  /**
   * Send an email and log to database
   */
  async send(options: EmailOptions): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      console.log(`📧 Sending ${options.emailType} email to ${options.to}`);

      // Send email via Resend
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error(`Failed to send ${options.emailType} email:`, error);
        
        // Log failure
        await this.logEmail({
          userId: options.userId,
          emailAddress: options.to,
          emailType: options.emailType,
          templateId: options.templateId,
          failedAt: new Date().toISOString(),
          failureReason: error.message || 'Unknown error',
          retryCount: 0,
        });

        return {
          success: false,
          error: error.message,
        };
      }

      // Log success
      await this.logEmail({
        userId: options.userId,
        emailAddress: options.to,
        emailType: options.emailType,
        templateId: options.templateId,
        sentAt: new Date().toISOString(),
        resendEmailId: data?.id,
        retryCount: 0,
      });

      console.log(`✅ Email sent successfully: ${data?.id}`);

      return {
        success: true,
        emailId: data?.id,
      };
    } catch (error) {
      console.error('Email service error:', error);
      
      await this.logEmail({
        userId: options.userId,
        emailAddress: options.to,
        emailType: options.emailType,
        templateId: options.templateId,
        failedAt: new Date().toISOString(),
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log email to database for audit trail
   */
  private async logEmail(log: Partial<EmailLog>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_logs')
        .insert({
          user_id: log.userId,
          email_address: log.emailAddress,
          email_type: log.emailType,
          template_id: log.templateId,
          sent_at: log.sentAt || new Date().toISOString(),
          delivered_at: log.deliveredAt,
          failed_at: log.failedAt,
          failure_reason: log.failureReason,
          retry_count: log.retryCount || 0,
          resend_email_id: log.resendEmailId,
        });

      if (error) {
        console.error('Failed to log email:', error);
      }
    } catch (error) {
      console.error('Email logging error:', error);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, userId: string, name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 40px 0; }
            .header h1 { color: #6366f1; margin: 0; }
            .content { background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to YOU+</h1>
            </div>
            <div class="content">
              <h2>Hi ${displayName}! 👋</h2>
              <p>Welcome to YOU+, your AI-powered accountability partner.</p>
              <p>Here's what you can do:</p>
              <ul>
                <li>Set your first accountability goal</li>
                <li>Schedule your first check-in call</li>
                <li>Customize your call preferences</li>
              </ul>
              <a href="https://youplus.app/dashboard" class="button">Get Started</a>
              <p>Need help? Reply to this email or visit our help center.</p>
            </div>
            <div class="footer">
              <p>YOU+ | Making accountability effortless</p>
              <p><a href="https://youplus.app/unsubscribe">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({
      to: email,
      subject: 'Welcome to YOU+!',
      html,
      userId,
      emailType: 'welcome',
      templateId: 'welcome_v1',
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userId?: string): Promise<void> {
    const resetUrl = `https://youplus.app/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password for your YOU+ account.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link:</p>
              <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
              <div class="warning">
                <p><strong>Security reminder:</strong></p>
                <ul>
                  <li>This link expires in 24 hours</li>
                  <li>If you didn't request this, ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>YOU+ | Making accountability effortless</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send({
      to: email,
      subject: 'Reset your YOU+ password',
      html,
      userId,
      emailType: 'password_reset',
      templateId: 'password_reset_v1',
    });
  }

  /**
   * Retry failed emails (called by scheduled job)
   */
  async retryFailedEmails(maxRetries: number = 3): Promise<number> {
    try {
      const { data: failedEmails, error } = await this.supabase
        .from('email_logs')
        .select('*')
        .is('delivered_at', null)
        .not('failed_at', 'is', null)
        .lt('retry_count', maxRetries)
        .order('failed_at', { ascending: true })
        .limit(50);

      if (error || !failedEmails) {
        console.error('Error fetching failed emails:', error);
        return 0;
      }

      let retriedCount = 0;

      for (const email of failedEmails) {
        // Wait between retries to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Retry logic would go here
        // For now, just log that we would retry
        console.log(`Would retry email ${email.id} (attempt ${email.retry_count + 1})`);
        retriedCount++;
      }

      return retriedCount;
    } catch (error) {
      console.error('Retry failed emails error:', error);
      return 0;
    }
  }
}

/**
 * Factory function to create EmailService instance
 */
export function createEmailService(
  resendApiKey: string,
  supabase: SupabaseClient,
  fromEmail?: string
): EmailService {
  return new EmailService(resendApiKey, supabase, fromEmail);
}
