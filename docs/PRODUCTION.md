# Production Deployment Guide

Complete guide for deploying the Cosmos SDK faucet with HTTPS, systemd service management, and automatic restarts.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Root or sudo access
- Domain name pointing to your server's IP
- Completed the basic setup steps from main README

## Step 1: Create Systemd Service

Create a systemd service file for automatic startup and restart:

```bash
sudo nano /etc/systemd/system/akash-faucet.service
```

Add the following content (adjust paths and chain-specific values):

```ini
[Unit]
Description=Akash Testnet Faucet
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/faucet
ExecStart=/usr/bin/node /root/faucet/faucet.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/akash-faucet.log
StandardError=append:/var/log/akash-faucet-error.log

# Environment variables
Environment="HOME=/root"
Environment="AKASH_KEYRING_BACKEND=test"
Environment="AKASH_GAS=auto"
Environment="AKASH_GAS_ADJUSTMENT=1.5"
Environment="AKASH_GAS_PRICES=0.025uakt"
Environment="AKASH_SIGN_MODE=amino-json"
Environment="AKASH_CHAIN_ID=testnet-8"
Environment="AKASH_NODE=https://rpc.testnet.akash.network:443"
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/bin"

[Install]
WantedBy=multi-user.target
```

**Important**: Update these values for your chain:
- `WorkingDirectory`: Path to your faucet directory
- `ExecStart`: Full path to node and faucet.js
- `User`: User running the faucet (if not root)
- `AKASH_CHAIN_ID`: Your chain's testnet ID
- `AKASH_NODE`: Your RPC endpoint
- `PATH`: Include the directory where your chain binary is installed

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable akash-faucet

# Start the service
sudo systemctl start akash-faucet

# Check status
sudo systemctl status akash-faucet

# View logs
sudo journalctl -u akash-faucet -f
```

## Step 2: Install and Configure NGINX

Install NGINX as a reverse proxy:

```bash
# Install NGINX
sudo apt update
sudo apt install nginx -y

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

Create NGINX configuration:

```bash
sudo nano /etc/nginx/sites-available/faucet
```

Add this configuration (replace `faucet.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name faucet.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/faucet /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

## Step 3: Install SSL Certificate with Let's Encrypt

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain SSL certificate (replace with your domain):

```bash
sudo certbot --nginx -d faucet.yourdomain.com
```

Follow the prompts:
1. Enter your email address
2. Agree to terms of service
3. Choose whether to share email with EFF (optional)

Certbot will automatically configure NGINX for HTTPS.

Update your NGINX configuration with security headers:

```bash
sudo nano /etc/nginx/sites-available/faucet
```

Your configuration should now look like this:

```nginx
server {
    listen 80;
    server_name faucet.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name faucet.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/faucet.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/faucet.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logs
    access_log /var/log/nginx/faucet-access.log;
    error_log /var/log/nginx/faucet-error.log;
}
```

Reload NGINX:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Step 4: Configure Firewall (Optional)

If using UFW:

```bash
# Allow SSH (if not already allowed)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 5: Test Certificate Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl list-timers | grep certbot
```

Certbot automatically sets up a systemd timer to renew certificates.

## Step 6: Verify Everything Works

```bash
# Check systemd service
sudo systemctl status akash-faucet

# Check NGINX
sudo systemctl status nginx

# Test health endpoint
curl https://faucet.yourdomain.com/health

# Test from external browser
# Open: https://faucet.yourdomain.com
```

## Management Commands

### Service Management
```bash
# View real-time logs
sudo journalctl -u akash-faucet -f

# Restart faucet
sudo systemctl restart akash-faucet

# Stop faucet
sudo systemctl stop akash-faucet

# Check status
sudo systemctl status akash-faucet
```

### NGINX Management
```bash
# Test configuration
sudo nginx -t

# Reload (after config changes)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Manually renew
sudo certbot renew

# Renew specific certificate
sudo certbot renew --cert-name faucet.yourdomain.com
```

### Monitor Wallet Balance
```bash
# Check faucet wallet balance
akash query bank balances $(akash keys show faucet-wallet -a)
```

## Troubleshooting

### Service Won't Start
```bash
# Check detailed logs
sudo journalctl -u akash-faucet -n 100

# Verify configuration
cat /etc/systemd/system/akash-faucet.service

# Test manually
cd /root/faucet
node faucet.js
```

### NGINX Issues
```bash
# Test configuration
sudo nginx -t

# Check if port 3000 is listening
sudo netstat -tulpn | grep 3000

# View NGINX error logs
sudo tail -50 /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Check certificate expiry
sudo certbot certificates

# View Let's Encrypt logs
sudo tail -50 /var/log/letsencrypt/letsencrypt.log

# Manually renew if needed
sudo certbot renew --force-renewal
```

### Wallet/Transaction Issues
```bash
# Verify wallet exists
akash keys list

# Check balance
akash query bank balances $(akash keys show faucet-wallet -a)

# Test transaction manually
akash tx bank send faucet-wallet <test-address> 5000000uakt --yes
```

## Security Best Practices

1. **Limit Wallet Funds**: Keep only enough tokens in the faucet wallet for expected usage
2. **Monitor Logs**: Regularly check logs for suspicious activity
3. **Update Regularly**: Keep system packages and Node.js updated
4. **Rate Limiting**: The faucet has built-in address-based rate limiting
5. **Firewall**: Use UFW or iptables to restrict unnecessary ports
6. **Backups**: Regularly backup your systemd service file and NGINX configuration

## Updating the Faucet

```bash
# Navigate to faucet directory
cd /root/faucet

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart service
sudo systemctl restart akash-faucet
```

---

**Your faucet is now production-ready!** 🎉