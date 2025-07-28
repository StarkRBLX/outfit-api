#!/bin/bash

# Setup Adminer for PostgreSQL Database Viewing
echo "Setting up Adminer for database viewing..."

# Install PHP and PostgreSQL support
sudo apt update
sudo apt install -y php php-fpm php-pgsql nginx

# Create web directory
sudo mkdir -p /var/www/adminer

# Download Adminer
sudo wget https://www.adminer.org/latest.php -O /var/www/adminer/index.php

# Set permissions
sudo chown -R www-data:www-data /var/www/adminer
sudo chmod 644 /var/www/adminer/index.php

# Create Nginx config for Adminer
sudo tee /etc/nginx/sites-available/adminer > /dev/null <<EOF
server {
    listen 8080;
    server_name _;
    root /var/www/adminer;
    index index.php;

    # Security: Only allow specific IPs (uncomment and modify)
    # allow YOUR_IP_ADDRESS;
    # deny all;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/adminer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart php*-fpm

echo "✅ Adminer setup complete!"
echo "🌐 Access at: http://your-domain.com:8080"
echo "📋 Database connection info:"
echo "   System: PostgreSQL"
echo "   Server: localhost"
echo "   Username: outfit_user"
echo "   Password: [your_db_password]"
echo "   Database: outfit_database"
echo ""
echo "🔒 SECURITY: Consider adding IP restrictions in the Nginx config!" 