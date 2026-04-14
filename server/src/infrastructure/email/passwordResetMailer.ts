import { sendTransactionalEmail } from './emailDelivery';

interface PasswordResetEmailPayload {
    to: string;
    name: string;
    resetUrl: string;
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    const appName = process.env.MAIL_APP_NAME?.trim() || 'InvoiceFlow';

    await sendTransactionalEmail({
        to: payload.to,
        subject: `${appName} password reset`,
        text: [
            `Hello ${payload.name},`,
            '',
            'We received a request to reset your password.',
            `Reset it here: ${payload.resetUrl}`,
            '',
            'If you did not request this, you can ignore this email.',
        ].join('\n'),
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
                <p>Hello ${payload.name},</p>
                <p>We received a request to reset your password.</p>
                <p>
                    <a
                        href="${payload.resetUrl}"
                        style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;"
                    >
                        Reset password
                    </a>
                </p>
                <p>If the button does not work, use this link:</p>
                <p><a href="${payload.resetUrl}">${payload.resetUrl}</a></p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `,
    });
}
