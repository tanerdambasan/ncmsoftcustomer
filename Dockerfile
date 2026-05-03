# ═══════════════════════════════════════════════════════
# NCMSoft Customer Portal — Multi-stage Dockerfile
# Stage 1: Vite build
# Stage 2: Nginx ile serve
# Subdomain: musteri.ncmteknoloji.com / tedarikci.ncmteknoloji.com
# ═══════════════════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build-time env
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Stage 2: Nginx ──
FROM nginx:alpine

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

