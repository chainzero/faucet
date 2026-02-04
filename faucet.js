import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Your proven working environment
const env = {
    ...process.env,
    AKASH_KEYRING_BACKEND: 'test',
    AKASH_GAS: 'auto',
    AKASH_GAS_ADJUSTMENT: '1.5',
    AKASH_GAS_PRICES: '0.025uakt',
    AKASH_SIGN_MODE: 'amino-json',
    AKASH_CHAIN_ID: 'testnet-8',
    AKASH_NODE: 'https://testnetrpc.akashnet.net:443'
};

// Rate limiting (simple in-memory storage)
const requestHistory = new Map();

// API endpoint
app.post('/faucet', async (req, res) => {
    const { address } = req.body;
    
    if (!address || !address.startsWith('akash1')) {
        return res.status(400).json({ error: 'Invalid Akash address' });
    }
    
    // Rate limiting: 1 request per address per 24 hours
    const now = Date.now();
    const lastRequest = requestHistory.get(address);
    if (lastRequest && (now - lastRequest) < 24 * 60 * 60 * 1000) {
        return res.status(429).json({ 
            error: 'Please wait 24 hours between requests',
            nextRequest: new Date(lastRequest + 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    console.log(`Sending 500 AKT to ${address}`);
    
    try {
        // Use your proven working command
        const command = `akash tx bank send faucet-wallet ${address} 500000000uakt --yes`;
        const { stdout, stderr } = await execAsync(command, { env });
        
        if (stderr && !stdout) {
            throw new Error(stderr);
        }
        
        console.log('Transaction successful:', stdout);
        requestHistory.set(address, now);
        
        // Extract transaction hash
        const txhashMatch = stdout.match(/txhash:\s*([A-F0-9]+)/i);
        const txhash = txhashMatch ? txhashMatch[1] : 'unknown';
        
        res.json({
            success: true,
            txhash: txhash,
            amount: '500000000uakt',
            message: '500 AKT sent successfully!'
        });
        
    } catch (error) {
        console.error('Transaction failed:', error.message);
        res.status(500).json({
            error: 'Transaction failed',
            details: error.message.substring(0, 200) // Limit error message length
        });
    }
});

// Web interface
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Akash Testnet-8 Faucet</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        input { 
            padding: 12px; 
            margin: 10px 0; 
            width: 100%; 
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        button { 
            padding: 12px 20px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
        }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .result { 
            margin-top: 20px; 
            padding: 15px; 
            border-radius: 5px; 
            word-break: break-all;
        }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .info { 
            background: #e3f2fd; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 20px;
            color: #1565c0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Akash Testnet-8 Faucet</h1>
        
        <div class="info">
            <strong>Get 500 AKT tokens for testing!</strong><br>
            • One request per address per 24 hours<br>
            • Tokens are for testnet use only<br>
            • Chain ID: testnet-8
        </div>
        
        <input type="text" id="address" placeholder="Enter Akash address (akash1...)" />
        <button onclick="requestTokens()" id="requestBtn">Request 500 AKT</button>
        
        <div id="result"></div>
        
        <div class="footer">
            Akash Network Testnet Faucet<br>
            <small>Powered by Akash CLI</small>
        </div>
    </div>
    
    <script>
        async function requestTokens() {
            const address = document.getElementById('address').value.trim();
            const resultDiv = document.getElementById('result');
            const btn = document.getElementById('requestBtn');
            
            if (!address) {
                resultDiv.innerHTML = '<div class="error">Please enter an address</div>';
                return;
            }
            
            if (!address.startsWith('akash1') || address.length < 40) {
                resultDiv.innerHTML = '<div class="error">Please enter a valid Akash address (starts with akash1)</div>';
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Processing...';
            resultDiv.innerHTML = '<div class="loading">⏳ Sending transaction to blockchain...</div>';
            
            try {
                const response = await fetch('/faucet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = \`
                        <div class="success">
                            <strong>✅ Success!</strong><br>
                            <strong>Amount:</strong> 500 AKT<br>
                            <strong>TX Hash:</strong> \${data.txhash}<br>
                            <strong>Recipient:</strong> \${address}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`<div class="error"><strong>❌ Error:</strong> \${data.error}</div>\`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="error"><strong>❌ Network Error:</strong> \${error.message}</div>\`;
            } finally {
                btn.disabled = false;
                btn.textContent = 'Request 500 AKT';
            }
        }
        
        // Allow Enter key to submit
        document.getElementById('address').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                requestTokens();
            }
        });
    </script>
</body>
</html>
    `);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Akash Faucet running on http://localhost:${PORT}`);
    console.log(`Using your proven Akash CLI configuration`);
});
