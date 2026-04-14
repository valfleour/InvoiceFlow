# Email Delivery Setup

InvoiceFlow sends password reset and email verification messages through either:

- Resend over HTTPS when `RESEND_API_KEY` is set.
- SMTP through Nodemailer when `RESEND_API_KEY` is not set.

For Render-hosted production deployments, prefer Resend because free web services cannot send outbound SMTP traffic.

## Production Setup On Render

Use these values in your Render server environment:

```env
CLIENT_ORIGIN=https://your-frontend-domain
PASSWORD_RESET_URL_ORIGIN=https://your-frontend-domain
EMAIL_VERIFICATION_URL_ORIGIN=https://your-frontend-domain
MAIL_FROM=InvoiceFlow <onboarding@your-domain>
MAIL_APP_NAME=InvoiceFlow
RESEND_API_KEY=re_xxxxxxxxx
RESEND_API_BASE_URL=https://api.resend.com
```

Notes:

1. `MAIL_FROM` must be a sender address your Resend account is allowed to use.
2. The password reset link points to `/reset-password?token=...` on your live client.
3. The verification link points to `/verify-email?token=...` on your live client.
4. Keep the SMTP variables empty when using Resend.

## Local Gmail SMTP Setup

Use these values in `server/.env`:

```env
CLIENT_ORIGIN=http://localhost:5173
PASSWORD_RESET_URL_ORIGIN=http://localhost:5173
EMAIL_VERIFICATION_URL_ORIGIN=http://localhost:5173
MAIL_FROM=InvoiceFlow <your-email@gmail.com>
MAIL_APP_NAME=InvoiceFlow
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
```

## Gmail Requirements

1. Turn on Google 2-Step Verification for the Gmail account you want to send from.
2. Create a Google App Password for that account.
3. Put that 16-character app password into `SMTP_PASS`.

## Notes

- The reset link points to `PASSWORD_RESET_URL_ORIGIN + /reset-password?token=...`.
- The verification link points to `EMAIL_VERIFICATION_URL_ORIGIN + /verify-email?token=...`.
- `MAIL_FROM` should usually match the Gmail account in `SMTP_USER`.
- Gmail is fine for testing and small internal use, but it is not ideal for production-scale email delivery.

## Test Flow

1. Start the server and client.
2. Open `/signin`.
3. Enter an existing account email.
4. Click `Forgot password?`.
5. Open the email and use the reset link.
6. Set a new password on `/reset-password`.

## Verification Flow

1. Start the server and client.
2. Open `/signup`.
3. Create a new account.
4. Open the verification email and use the link.
5. Finish on `/verify-email`.
