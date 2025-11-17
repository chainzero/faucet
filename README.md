# Cosmos SDK Faucet

A simple, reliable faucet for Cosmos SDK based blockchains that uses the native CLI for maximum compatibility.

🚀 **Live Example**: [Akash Testnet Faucet](https://faucet.dev.akash.pub)

## ✨ Features

- 🔧 **Simple Setup**: Clone and run in minutes
- 🛡️ **Rate Limited**: Built-in spam protection
- 🌐 **Web Interface**: Clean, responsive UI
- 🔒 **Production Ready**: Systemd + NGINX + TLS support
- ⚡ **CLI Based**: Uses native chain binaries for maximum compatibility
- 📊 **Health Monitoring**: Built-in health check endpoint

## 🚀 Quick Setup (Development/Testing)

Perfect for development and internal testing:

### Prerequisites
- Node.js v16+
- Cosmos SDK chain binary (e.g., `akash`, `gaiad`, `junod`)
- Funded wallet with testnet tokens

### Setup Steps

```bash
# 1. Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install your chain binary
curl -sSL https://get.akash.network | bash  # Example for Akash
# Verify installation
akash version

# 3. Create and fund faucet wallet
akash keys add faucet-wallet --recover
# Enter your funded mnemonic when prompted

# Verify wallet has funds
akash query bank balances $(akash keys show faucet-wallet -a)

# 4. Clone and setup faucet
git clone https://github.com/chainzero/faucet.git
cd faucet
npm install

# 5. Configure for your chain
# Edit the environment variables in faucet.js:
nano faucet.js

# Update these values:
# - AKASH_CHAIN_ID: Your testnet chain ID (e.g., 'testnet-8')
# - AKASH_NODE: Your RPC endpoint (e.g., 'https://rpc.testnet.akash.network:443')
# - Binary name: Change 'akash' to your chain binary in the command
# - Wallet name: Ensure it matches the wallet you created ('faucet-wallet')

# 6. Run the faucet
node faucet.js

# 7. Access at http://localhost:3000
```

### Test the Faucet

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test token request
curl -X POST http://localhost:3000/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"akash1your-test-address"}'
```

## 🏭 Production Deployment (HTTPS + Auto-restart)

For public testnet faucets with HTTPS, auto-restart, and systemd management:

**[Production Setup Guide](docs/PRODUCTION.md)** - Complete guide for:
- Systemd service configuration
- NGINX reverse proxy setup
- Let's Encrypt SSL/TLS certificates
- Automatic certificate renewal
- Service management and monitoring

## 📡 API Reference

### Request Tokens
```bash
curl -X POST https://your-faucet-domain.com/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "cosmos1..."}'
```

**Response (Success):**
```json
{
  "success": true,
  "txhash": "ABC123...",
  "amount": "100000000uakt",
  "message": "100 AKT sent successfully!"
}
```

**Response (Rate Limited):**
```json
{
  "error": "Please wait 24 hours between requests"
}
```

### Health Check
```bash
curl https://your-faucet-domain.com/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T16:00:00.000Z"
}
```

## 🛠️ Configuration

The faucet is configured via environment variables in `faucet.js`. Key settings:

### Required Configuration
- **AKASH_CHAIN_ID**: Your testnet chain identifier (e.g., `testnet-8`)
- **AKASH_NODE**: Blockchain RPC endpoint URL
- **Wallet Name**: Name of the faucet wallet (in the CLI command)
- **Amount**: Tokens to send per request in base denomination (e.g., `100000000uakt` = 100 AKT)

### Optional Configuration
- **AKASH_GAS**: Gas calculation mode (default: `auto`)
- **AKASH_GAS_ADJUSTMENT**: Gas adjustment multiplier (default: `1.5`)
- **AKASH_GAS_PRICES**: Gas price (default: `0.025uakt`)
- **AKASH_SIGN_MODE**: Transaction signing mode (default: `amino-json`)
- **AKASH_KEYRING_BACKEND**: Keyring storage backend (default: `test`)

### Rate Limiting
- **Address limit**: 1 request per address per 24 hours (in-memory)
- **IP limit**: Can be configured in the code (currently not enforced)

### Example Configuration for Different Chains

**Akash Network:**
```javascript
AKASH_CHAIN_ID: 'testnet-8'
AKASH_NODE: 'https://rpc.testnet.akash.network:443'
```

**Cosmos Hub:**
```javascript
AKASH_CHAIN_ID: 'theta-testnet-001'
AKASH_NODE: 'https://rpc.sentry-01.theta-testnet.polypore.xyz:443'
// Change binary from 'akash' to 'gaiad' in the command
```

**Juno:**
```javascript
AKASH_CHAIN_ID: 'uni-6'
AKASH_NODE: 'https://rpc.uni.junonetwork.io:443'
// Change binary from 'akash' to 'junod' in the command
```

## 🔍 Monitoring & Troubleshooting

### View Logs (Systemd)
```bash
# Real-time logs
sudo journalctl -u akash-faucet -f

# Last 50 lines
sudo journalctl -u akash-faucet -n 50

# View log files
tail -f /var/log/akash-faucet.log
tail -f /var/log/akash-faucet-error.log
```

### Service Management
```bash
# Check status
sudo systemctl status akash-faucet

# Restart service
sudo systemctl restart akash-faucet

# Stop service
sudo systemctl stop akash-faucet

# Start service
sudo systemctl start akash-faucet
```

### Common Issues

**Service won't start:**
- Check logs: `sudo journalctl -u akash-faucet -n 50`
- Verify wallet exists: `akash keys list`
- Verify environment variables in service file
- Ensure HOME environment variable is set in systemd service

**Transactions failing:**
- Check wallet balance: `akash query bank balances $(akash keys show faucet-wallet -a)`
- Verify RPC endpoint is accessible
- Check chain ID matches your testnet
- Verify gas settings are appropriate

**NGINX errors:**
- Check NGINX config: `sudo nginx -t`
- View error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify faucet is running on port 3000: `netstat -tulpn | grep 3000`

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Keep it simple - this faucet intentionally uses minimal dependencies
- Test with multiple Cosmos SDK chains
- Update documentation for new features
- Follow existing code style

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/chainzero/faucet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chainzero/faucet/discussions)
- **Akash Discord**: [discord.akash.network](https://discord.akash.network)

## 🏗️ Built With

- **Node.js + Express**: Lightweight web framework
- **Vanilla JavaScript**: No build process required
- **Cosmos SDK CLI**: Native chain integration for maximum compatibility
- **Systemd**: Process management and auto-restart
- **NGINX**: Reverse proxy and TLS termination
- **Let's Encrypt**: Free SSL/TLS certificates

## 🌟 Why CLI-Based?

This faucet uses the native Cosmos SDK CLI instead of libraries like CosmJS because:

1. **Maximum Compatibility**: Works with any Cosmos SDK chain without library updates
2. **Simplicity**: No complex transaction signing or chain-specific configurations
3. **Reliability**: Uses the same proven tooling as validators and node operators
4. **Easy Debugging**: Transaction issues can be tested directly with CLI commands
5. **No Dependencies**: Minimal npm packages means fewer security vulnerabilities

---
