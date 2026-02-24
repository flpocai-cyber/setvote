# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências primeiro (cache eficiente)
COPY package*.json ./
RUN npm ci --silent

# Copiar código e fazer build
COPY . .
RUN npm run build

# ── Stage 2: Servir com Nginx ────────────────────────────────
FROM nginx:alpine

# Copiar build do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx para React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
