FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.html styles.css script.js server.mjs enquiries.mjs ./
COPY ["samnad logo.png", "Samnad Moonlight tanker fleet-1.png", "Branded Samnad Moonlight tanker fleet-2.png", "Samnad Moonlight tanker fleet-3.png", "/app/"]
ENV NODE_ENV=production HOST=0.0.0.0 PORT=80
USER node
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:80/health || exit 1
CMD ["node", "server.mjs"]
