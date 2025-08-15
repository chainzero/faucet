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

## 🚀 Quick Setup (HTTP)

Perfect for development and internal testing:

### Prerequisites
- Node.js v16+
- Cosmos SDK chain binary (e.g., `akash`, `gaiad`, `junod`)
- Funded wallet with testnet tokens

### Setup
```bash
# 1. Install your chain binary
curl -sSL https://get.akash.network | bash  # Example for Akash

# 2. Create and fund faucet wallet
akash keys add faucet-wallet --recover
# Enter your funded mnemonic when prompted

# 3. Clone and setup faucet
git clone https://github.com/chainzero/faucet.git
cd faucet
npm install

# 4. Configure for your chain
# Edit the environment variables in faucet.js:
# - AKASH_CHAIN_ID: Your testnet chain ID
# - AKASH_NODE: Your RPC endpoint
# - Binary name: Change 'akash' to your chain binary

# 5. Run the faucet
node faucet.js

# 6. Access at http://localhost:3000
```

## 🏭 Production Deployment

For public testnet faucets with HTTPS and auto-restart:

- **[Production Setup Guide](docs/production-deployment.md)** - Systemd + NGINX
- **[TLS/HTTPS Setup](docs/tls-setup.md)** - Let's Encrypt configuration  
- **[Configuration Guide](docs/configuration.md)** - Chain-specific setup

## 🔧 Chain Configuration Examples

- **[Akash Network](examples/configs/akash-testnet.md)**
- **[Cosmos Hub](examples/configs/cosmos-hub-testnet.md)**
- **[Generic Cosmos Chain](examples/configs/generic-cosmos.md)**

## 📡 API Reference

### Request Tokens
```bash
curl -X POST http://localhost:3000/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "cosmos1..."}'
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 🛠️ Configuration

The faucet is configured via environment variables in `faucet.js`. Key settings:

- **Chain ID**: Your testnet chain identifier
- **RPC Node**: Blockchain RPC endpoint  
- **Amount**: Tokens to send per request (in base denomination)
- **Rate Limiting**: Requests per address per time period

See [Configuration Guide](docs/configuration.md) for details.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/chainzero/faucet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chainzero/faucet/discussions)

## 🏗️ Built With

- **Node.js + Express**: Lightweight web framework
- **Vanilla JavaScript**: No build process required
- **Cosmos SDK CLI**: Native chain integration
- **Systemd**: Process management
- **NGINX**: Reverse proxy and TLS termination

---
