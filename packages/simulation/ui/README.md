# Vault Simulation UI

A beautiful web-based interface for interacting with the vault simulation in real-time.

## Features

- 🎨 Modern, responsive UI design
- 📊 Real-time vault metrics and share price chart
- 💰 Deposit and withdraw tokens
- 👥 View all users and their balances
- 🤖 Monitor agent allocations
- 📝 Transaction history
- ⏱️ Automatic yield generation (7% every 5 minutes)
- 📈 Share price visualization over time

## Quick Start

### 1. Install Dependencies

```bash
cd simulation/ui
pip install -r requirements.txt
```

### 2. Start the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 3. Open in Browser

Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

### Starting the Simulation

1. Click the **"▶ Start"** button to begin the simulation
2. The simulation will automatically apply 7% yield every 5 minutes
3. You can deposit/withdraw at any time

### Depositing Tokens

1. Enter a user address (e.g., `0xUserA`)
2. Enter the amount to deposit
3. Click **"💵 Deposit"**
4. The system will calculate and mint shares based on current share price

### Withdrawing Tokens

1. Enter the user address
2. Enter shares to withdraw (or type `all` to withdraw everything)
3. Click **"💸 Withdraw"**
4. Assets will be returned based on current share price

### Monitoring

- **Vault Metrics**: See total assets, shares, and share price
- **Share Price Chart**: Visualize share price over time
- **Users**: View all users and their balances
- **Agents**: See how capital is allocated across 3 agents
- **Transactions**: View recent deposit/withdrawal history

## API Endpoints

The UI uses the following API endpoints:

- `GET /api/status` - Get current vault status
- `POST /api/deposit` - Deposit tokens
- `POST /api/withdraw` - Withdraw tokens
- `GET /api/history` - Get historical data for charts
- `GET /api/transactions` - Get transaction history
- `GET /api/yield-history` - Get yield event history
- `POST /api/start` - Start simulation
- `POST /api/stop` - Stop simulation
- `POST /api/reset` - Reset simulation

## Example Workflow

1. **Start Simulation**: Click "▶ Start"
2. **User A Deposits**: 
   - Address: `0xUserA`
   - Amount: `100`
   - Click "💵 Deposit"
3. **Wait for Yield**: After 5 minutes, 7% yield is automatically applied
4. **User B Deposits**:
   - Address: `0xUserB`
   - Amount: `150`
   - Click "💵 Deposit"
5. **Monitor Share Price**: Watch the chart update as yield is applied
6. **User A Withdraws**:
   - Address: `0xUserA`
   - Shares: `all`
   - Click "💸 Withdraw"
7. **View Results**: Check user balances and net gains

## Screenshots

The UI includes:
- Real-time metrics dashboard
- Interactive share price chart
- User management interface
- Transaction history
- Agent status monitoring

## Technical Details

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript with Chart.js
- **Updates**: Auto-refreshes every 2 seconds
- **Chart Library**: Chart.js for share price visualization

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, modify `app.py`:

```python
app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
```

### Chart Not Updating

- Ensure the simulation is running
- Check browser console for errors
- Verify API endpoints are responding

### Yield Not Applying

- Make sure you clicked "▶ Start"
- Yield applies every 5 minutes automatically
- Check the browser console for any errors

