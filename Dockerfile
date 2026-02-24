# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Declarar build args (passados pelo EasyPanel)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Tornar disponíveis para o Vite durante o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

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
