# Starting the Vault Simulation UI

## Quick Start Command

```bash
cd simulation/ui
pip3 install -r requirements.txt
python3 app.py
```

Or use the startup script:

```bash
cd simulation/ui
./start.sh
```

## Access the UI

Once the server is running, open your browser and navigate to:

```
http://localhost:5000
```

## What's Running

The Flask server provides:
- **Backend API**: REST endpoints at `/api/*`
- **Frontend UI**: Web interface at `/`

Both are served from the same Flask application.

## Server Output

You should see:
```
================================================================================
Vault Simulation UI
================================================================================
Starting web server on http://localhost:5000
Open your browser to view the UI
================================================================================
 * Running on http://0.0.0.0:5000
```

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, modify `app.py` line 277:

```python
app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
```

### Dependencies Not Installed

Make sure Flask and flask-cors are installed:

```bash
pip3 install Flask flask-cors
```

### Import Errors

Ensure you're running from the `simulation/ui` directory:

```bash
cd simulation/ui
python3 app.py
```

