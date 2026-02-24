#!/bin/bash
# ============================================================
# setup_vps.sh — Configuração COMPLETA da VPS Hostinger
# Rode este script NA VPS via SSH como root ou sudo
# ============================================================

set -e  # Para em caso de erro

# --- CONFIGURAÇÕES — EDITE AQUI ---
DOMAIN="seu-dominio.com"       # Seu dominio ou IP da VPS
APP_DIR="/var/www/setvote"
ENABLE_HTTPS=true              # false se não tiver dominio configurado
# ----------------------------------

echo "============================================"
echo "  SetVote — Setup da VPS"
echo "============================================"

# 1. Atualizar sistema
echo "[1/6] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Instalar Nginx
echo "[2/6] Instalando Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# 3. Criar diretório do app
echo "[3/6] Criando diretório do app..."
mkdir -p $APP_DIR
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# 4. Configurar Nginx
echo "[4/6] Configurando Nginx..."
cat > /etc/nginx/sites-available/setvote << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR;
    index index.html;

    # Necessário para React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1024;
}
EOF

# Remover config padrão e ativar setvote
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/setvote /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 5. Configurar firewall
echo "[5/6] Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    echo "y" | ufw enable
fi

# 6. HTTPS com Let's Encrypt (se habilitado)
if [ "$ENABLE_HTTPS" = true ] && [[ "$DOMAIN" != *"."* == false ]]; then
    echo "[6/6] Instalando certificado SSL..."
    apt-get install -y certbot python3-certbot-nginx -qq
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    # Renovação automática
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "  ✅ HTTPS configurado com renovação automática!"
else
    echo "[6/6] Pulando HTTPS (domínio não configurado ou ENABLE_HTTPS=false)"
fi

echo ""
echo "============================================"
echo "  ✅ VPS configurada com sucesso!"
echo "  Acesse: http://$DOMAIN"
echo ""
echo "  Próximo passo: envie os arquivos do build"
echo "  usando o script deploy.ps1 no Windows."
echo "============================================"
