FROM nginx:1.28.0-alpine@sha256:30f1c0d78e0ad60901648be663a710bdadf19e4c10ac6782c235200619158284
COPY public/ /usr/share/nginx/html/
COPY hosting/default.conf.template /etc/nginx/templates/default.conf.template
COPY hosting/20-contact-config.sh /docker-entrypoint.d/20-contact-config.sh
RUN chmod 755 /docker-entrypoint.d/20-contact-config.sh
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
