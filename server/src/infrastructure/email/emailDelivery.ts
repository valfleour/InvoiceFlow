import https from 'https';
import nodemailer from 'nodemailer';

export interface TransactionalEmail {
    to: string;
    subject: string;
    text: string;
    html: string;
}

type EmailProviderConfig =
    | {
        provider: 'resend';
        apiKey: string;
        apiBaseUrl: string;
    }
    | {
        provider: 'smtp';
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };

let cachedSmtpTransporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
    const value = env[name]?.trim();

    if (!value) {
        throw new Error(`Email delivery is not configured. Missing ${name}.`);
    }

    return value;
}

export function resolveEmailProviderConfig(env: NodeJS.ProcessEnv = process.env): EmailProviderConfig {
    const resendApiKey = env.RESEND_API_KEY?.trim();

    if (resendApiKey) {
        return {
            provider: 'resend',
            apiKey: resendApiKey,
            apiBaseUrl: env.RESEND_API_BASE_URL?.trim() || 'https://api.resend.com',
        };
    }

    return {
        provider: 'smtp',
        host: getRequiredEnv('SMTP_HOST', env),
        port: Number(env.SMTP_PORT ?? '587'),
        secure: (env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
        user: getRequiredEnv('SMTP_USER', env),
        pass: getRequiredEnv('SMTP_PASS', env),
    };
}

function getSmtpTransporter(config: Extract<EmailProviderConfig, { provider: 'smtp' }>) {
    if (cachedSmtpTransporter) {
        return cachedSmtpTransporter;
    }

    cachedSmtpTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    return cachedSmtpTransporter;
}

async function sendWithResend(
    config: Extract<EmailProviderConfig, { provider: 'resend' }>,
    from: string,
    email: TransactionalEmail
): Promise<void> {
    const url = new URL('/emails', config.apiBaseUrl);
    const body = JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
    });

    await new Promise<void>((resolve, reject) => {
        const request = https.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || undefined,
                path: `${url.pathname}${url.search}`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'User-Agent': 'InvoiceFlow/1.0',
                },
            },
            (response) => {
                let responseBody = '';

                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    responseBody += chunk;
                });
                response.on('end', () => {
                    const statusCode = response.statusCode ?? 500;

                    if (statusCode >= 200 && statusCode < 300) {
                        resolve();
                        return;
                    }

                    let details = '';

                    if (responseBody) {
                        try {
                            const parsed = JSON.parse(responseBody) as { message?: string; error?: unknown; name?: string };
                            details = parsed.message
                                || (typeof parsed.error === 'string' ? parsed.error : '')
                                || parsed.name
                                || responseBody;
                        } catch {
                            details = responseBody;
                        }
                    }

                    reject(new Error(`Resend email delivery failed with status ${statusCode}${details ? `: ${details}` : ''}`));
                });
            }
        );

        request.on('error', (error) => {
            reject(error);
        });

        request.write(body);
        request.end();
    });
}

export async function sendTransactionalEmail(email: TransactionalEmail): Promise<void> {
    const from = getRequiredEnv('MAIL_FROM');
    const providerConfig = resolveEmailProviderConfig();

    if (providerConfig.provider === 'resend') {
        await sendWithResend(providerConfig, from, email);
        return;
    }

    const transporter = getSmtpTransporter(providerConfig);
    await transporter.sendMail({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
    });
}
