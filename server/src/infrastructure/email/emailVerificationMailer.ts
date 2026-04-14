import { sendTransactionalEmail } from './emailDelivery';

interface EmailVerificationPayload {
    to: string;
    name: string;
    verificationUrl: string;
}

export async function sendEmailVerificationEmail(payload: EmailVerificationPayload): Promise<void> {
    const appName = process.env.MAIL_APP_NAME?.trim() || 'InvoiceFlow';

    await sendTransactionalEmail({
        to: payload.to,
        subject: `${appName} email verification`,
        text: [
            `Hello ${payload.name},`,
            '',
            'Please verify your email address to finish setting up your account.',
            `Verify your email here: ${payload.verificationUrl}`,
            '',
            'If you did not create this account, you can ignore this email.',
        ].join('\n'),
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
                <p>Hello ${payload.name},</p>
                <p>Please verify your email address to finish setting up your account.</p>
                <p>
                    <a
                        href="${payload.verificationUrl}"
                        style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;"
                    >
                        Verify email
                    </a>
                </p>
                <p>If the button does not work, use this link:</p>
                <p><a href="${payload.verificationUrl}">${payload.verificationUrl}</a></p>
                <p>If you did not create this account, you can ignore this email.</p>
            </div>
        `,
    });
}
