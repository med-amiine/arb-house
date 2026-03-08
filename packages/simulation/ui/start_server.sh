#!/bin/bash

# Start the Vault Simulation UI with correct Python environment

cd "$(dirname "$0")"

echo "=========================================="
echo "Vault Simulation UI"
echo "=========================================="
echo ""
echo "Installing dependencies..."
python3 -m pip install -q Flask flask-cors

echo ""
echo "Starting server..."
echo "Open http://localhost:5000 in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

python3 app.py

