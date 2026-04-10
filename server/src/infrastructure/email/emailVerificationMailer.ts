import nodemailer from 'nodemailer';

interface EmailVerificationPayload {
    to: string;
    name: string;
    verificationUrl: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Email delivery is not configured. Missing ${name}.`);
    }

    return value;
}

function getTransporter() {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    const host = getRequiredEnv('SMTP_HOST');
    const port = Number(process.env.SMTP_PORT ?? '587');
    const secure = (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
    const user = getRequiredEnv('SMTP_USER');
    const pass = getRequiredEnv('SMTP_PASS');

    cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    return cachedTransporter;
}

export async function sendEmailVerificationEmail(payload: EmailVerificationPayload): Promise<void> {
    const transporter = getTransporter();
    const from = getRequiredEnv('MAIL_FROM');
    const appName = process.env.MAIL_APP_NAME?.trim() || 'InvoiceFlow';

    await transporter.sendMail({
        from,
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
