FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css script.js /usr/share/nginx/html/
COPY ["samnad logo.png", "Samnad Moonlight tanker fleet-1.png", "Branded Samnad Moonlight tanker fleet-2.png", "Samnad Moonlight tanker fleet-3.png", "/usr/share/nginx/html/"]
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
