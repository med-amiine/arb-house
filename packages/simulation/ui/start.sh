#!/bin/bash

# Start the Vault Simulation UI

echo "=========================================="
echo "Vault Simulation UI"
echo "=========================================="
echo ""
echo "Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "Starting server..."
echo "Open http://localhost:5000 in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="
echo ""

python app.py

