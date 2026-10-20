# Samnad Moonlight

A responsive, photography-led company website using the four supplied brand assets. No build step or dependencies required. Requires Node.js 18 or newer.

Run `npm run dev` and open http://localhost:3000. Run `npm run check` to validate JavaScript syntax. Deploy the HTML, CSS, JavaScript, and four PNG files to any static host.

Includes a three-image crossfade hero with manual controls and pause, reduced-motion support, mobile navigation, company introduction, photographic operations sections, and a local enquiry-file download.

Before public launch, confirm all company copy and supply the official company history, services, contact email, telephone, and address. Current descriptive copy is intentionally general; images do not verify ownership of facilities or operational capabilities. The enquiry form does not transmit information; connect a verified recipient and server-side form delivery before accepting live enquiries.

The original logo appears in a compact crop alongside a readable wordmark. Original supplied files are preserved. DM Sans loads from Google Fonts with a system fallback.

## Coolify / Contabo deployment

Repository: https://github.com/3my1234/samnad

The included Dockerfile serves the site through Nginx on port 80 with a health check. No environment variables or persistent volumes are needed.

1. Commit and push the project files to the GitHub repository.
2. Once your Contabo server is connected to Coolify, create an Application from this Git repository (use a GitHub connection for a private repository).
3. Select the branch containing these files, choose the Dockerfile build pack, and use the root directory `/` and Dockerfile `/Dockerfile`.
4. Set the application port to `80`, configure your domain, point its DNS to the Contabo server, and deploy. Coolify can manage HTTPS at the proxy.
5. Enable automatic deployments if desired and verify the live domain after deployment.

Optional local Docker preview: `docker build -t samnad-moonlight .` then `docker run --rm -p 8080:80 samnad-moonlight`.
