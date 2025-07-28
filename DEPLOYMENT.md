# Outfit Database API - Deployment Guide

## Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM
- 100GB+ storage
- Node.js 16+
- PostgreSQL 12+
- Nginx

## Step-by-Step Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql postgresql-contrib nodejs npm ufw fail2ban

# Install PM2 for process management (alternative to systemd)
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE outfit_database;
CREATE USER outfit_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE outfit_database TO outfit_user;
\q

# Configure PostgreSQL (edit /etc/postgresql/*/main/postgresql.conf)
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Configure authentication (edit /etc/postgresql/*/main/pg_hba.conf)
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: local   outfit_database   outfit_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/outfit-api
sudo chown $USER:$USER /var/www/outfit-api

# Upload your files to /var/www/outfit-api
cd /var/www/outfit-api

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
```

### 4. Environment Configuration

Edit `.env` file with your settings:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=outfit_database
DB_USER=outfit_user
DB_PASSWORD=your_secure_password

# Server Configuration
PORT=3000
NODE_ENV=production

# API Security
API_KEY=your_very_secure_api_key_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 5. Database Initialization

```bash
# Run database setup
npm run setup-db
```

### 6. Security Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 7. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Nginx Configuration

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/outfit-api
sudo ln -s /etc/nginx/sites-available/outfit-api /etc/nginx/sites-enabled/

# Update domain name in config
sudo nano /etc/nginx/sites-available/outfit-api
# Replace 'your-domain.com' with your actual domain

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 9. Process Management

#### Option A: Using systemd

```bash
# Copy service file
sudo cp outfit-api.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable outfit-api
sudo systemctl start outfit-api

# Check status
sudo systemctl status outfit-api
```

#### Option B: Using PM2 (Recommended)

```bash
# Start application with PM2
pm2 start server.js --name "outfit-api"

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions displayed

# Monitor
pm2 status
pm2 logs outfit-api
```

### 10. Monitoring & Logs

```bash
# Check application logs
pm2 logs outfit-api

# Or with systemd
sudo journalctl -u outfit-api -f

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## API Testing

Test your API endpoints:

```bash
# Health check
curl https://your-domain.com/health

# Test with API key
curl -X POST https://your-domain.com/api/UploadOutfit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "Name": "Test Outfit",
    "AccessoryData": "{\"hat\": 123, \"shirt\": 456}",
    "Price": 100
  }'
```

## Security Checklist

- [ ] Strong database passwords
- [ ] Secure API key (32+ characters)
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Fail2ban active
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Non-root user for application

## Backup Strategy

```bash
# Database backup script
#!/bin/bash
pg_dump -h localhost -U outfit_user outfit_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Add to crontab for daily backups
# 0 2 * * * /path/to/backup_script.sh
```

## Performance Optimization

1. **Database Indexing**: Already included in setup-database.js
2. **Connection Pooling**: Configured in server.js
3. **Rate Limiting**: Configured with express-rate-limit
4. **Nginx Caching**: Add to nginx.conf if needed

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT version();"
   ```

3. **Permission denied errors**
   ```bash
   sudo chown -R $USER:$USER /var/www/outfit-api
   ```

4. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

## Scaling Considerations

For higher traffic:
- Use connection pooling (already implemented)
- Consider Redis for caching
- Database read replicas
- Load balancer with multiple API instances
- CDN for static content

## Support

Monitor these metrics:
- API response times
- Database connection count
- Memory usage
- Disk space
- Error rates

Set up alerts for:
- High error rates (>5%)
- High response times (>1s)
- Low disk space (<10GB)
- High memory usage (>80%) 