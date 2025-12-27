#!/bin/bash
set -e

# Sales Agent Demo - VPS Setup Script
# Run this on the VPS to set up the application

echo "=== Sales Agent Demo Setup ==="

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 2. Create application directory
echo "Creating application directory..."
mkdir -p /opt/sales-agent-demo
cd /opt/sales-agent-demo

# 3. Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/louayelbiche/sales-agent-demo.git .
fi

# 4. Create .env file from template
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Resend
RESEND_API_KEY=re_your-key-here
RESEND_FROM_EMAIL=demo@sales.runwellsystems.com

# App URL
NEXT_PUBLIC_APP_URL=https://sales.runwellsystems.com
EOF
    echo "IMPORTANT: Edit /opt/sales-agent-demo/.env with your actual credentials!"
fi

# 5. Set up nginx
echo "Setting up nginx..."
cp deploy/nginx.conf /etc/nginx/sites-available/sales.runwellsystems.com
ln -sf /etc/nginx/sites-available/sales.runwellsystems.com /etc/nginx/sites-enabled/

# 6. Get SSL certificate (run after DNS is configured)
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/sales-agent-demo/.env with your credentials"
echo "2. Configure DNS: A record for sales.runwellsystems.com -> $(curl -s ifconfig.me)"
echo "3. Get SSL certificate:"
echo "   certbot certonly --webroot -w /var/www/certbot -d sales.runwellsystems.com"
echo "4. Start the application:"
echo "   cd /opt/sales-agent-demo && docker compose -f docker-compose.prod.yml up -d"
echo "5. Run database migrations:"
echo "   docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy"
echo "6. Restart nginx:"
echo "   systemctl restart nginx"
