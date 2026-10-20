# Samnad Moonlight

A responsive, photography-led company website with server-side diesel purchase enquiries. Requires Node.js 22 or newer and SMTP credentials for email delivery.

Run `npm ci`, then `npm run dev` and open http://localhost:3000. For local email delivery copy `.env.example` to `.env`, fill in credentials, and run `node --env-file=.env server.mjs`. Run `npm run check` and `npm test` for validation. This application now needs a Node server; static-only hosting cannot deliver enquiries.

Includes a five-second crossfade hero, manual controls and pause, reduced-motion support, mobile navigation, company introduction, and a diesel request form. Requests contain name, phone, optional email/company, litres, delivery location, optional delivery date/notes, and permission to contact. SMTP acceptance is required before displaying success. Failed requests retain form values.

Confirm company copy and official details before launch. Images do not independently verify facility ownership or operational capabilities. The form submits enquiries rather than confirmed purchases. Delivery and price require sales follow-up. No customer database or payment handling is included.

The original logo appears in a compact crop alongside a readable wordmark. Original supplied files are preserved. DM Sans loads from Google Fonts with a system fallback.

## Coolify / Contabo deployment

Repository: https://github.com/3my1234/samnad

The Dockerfile runs the Node server on port 80 with a `/health` check. Coolify must use Dockerfile build pack with internal port 80. Existing nginx.conf is unused. No persistent volume is required.

1. Commit and push the project files to the GitHub repository.
2. Once your Contabo server is connected to Coolify, create an Application from this Git repository (use a GitHub connection for a private repository).
3. Select the branch containing these files, choose the Dockerfile build pack, and use the root directory `/` and Dockerfile `/Dockerfile`.
4. Set the application port to `80`, configure your domain, point its DNS to the Contabo server, and deploy. Coolify can manage HTTPS at the proxy.
5. Configure the runtime environment below, redeploy, and submit a test enquiry; verify its arrival in the sales inbox (including Spam). Automated tests mock SMTP; they do not prove real inbox delivery.

Optional local Docker preview: `docker build -t samnad-moonlight .` then `docker run --rm -p 8080:80 samnad-moonlight`.

## Email environment variables

Add the values from `.env.example` to Coolify runtime environment variables, not build arguments. `SALES_EMAIL` is the recipient and may be changed independently of the sender. `MAIL_FROM` must be an address permitted by the SMTP provider.

For the temporary Gmail sender/recipient:

```text
PUBLIC_ORIGIN=https://samnadoilandgas.sportbanter.online
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=atlanticexpress.msg@gmail.com
SMTP_PASS=<Gmail App Password>
MAIL_FROM=atlanticexpress.msg@gmail.com
SALES_EMAIL=atlanticexpress.msg@gmail.com
TRUST_PROXY=true
```

Enable Google 2-Step Verification and generate an App Password at https://myaccount.google.com/apppasswords. Store it only in Coolify as a secret; never commit it or share it in chat. If App Passwords are unavailable for the account, use another supported SMTP provider. Google guidance: https://support.google.com/accounts/answer/185833.

`PUBLIC_ORIGIN` must match the final browser origin exactly, without a trailing slash. Enable `TRUST_PROXY` only behind Coolify's trusted reverse proxy with no direct public container port mapping. Request limits are in-memory: five attempts per client per 15 minutes and 100 per instance per hour; restarts reset them. Honeypot, body limits, server-side validation and same-origin checks provide basic abuse controls. Scale to a shared rate limiter and CAPTCHA if traffic requires it.

The mail provider accepting a request does not guarantee inbox placement. Failures are reported without logging customer details or credentials. Requests are not saved locally; sales records live in the receiving mailbox. Monitor that mailbox and restrict access appropriately.
