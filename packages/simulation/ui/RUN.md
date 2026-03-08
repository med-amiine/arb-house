# Run the Vault Simulation UI

## Commands to Start the Server

### Step 1: Install Dependencies (if not already installed)

```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui
pip3 install Flask flask-cors
```

### Step 2: Start the Server

```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui
python3 app.py
```

You should see output like:
```
================================================================================
Vault Simulation UI
================================================================================
Starting web server on http://localhost:5000
Open your browser to view the UI
================================================================================
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

### Step 3: Open in Browser

Once the server is running, open:
```
http://localhost:5000
```

## Alternative: One-Line Command

```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui && pip3 install -q Flask flask-cors && python3 app.py
```

## If Port 5000 is Already in Use

If you get an error about port 5000 being in use, you can:

1. **Kill the existing process:**
   ```bash
   lsof -ti:5000 | xargs kill -9
   ```

2. **Or change the port in `app.py`** (line 277):
   ```python
   app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
   ```
   Then access at `http://localhost:5001`

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

## What You'll See

- **Backend API**: Running on `http://localhost:5000/api/*`
- **Frontend UI**: Running on `http://localhost:5000/`

The server provides both the REST API and the web interface from the same Flask application.

