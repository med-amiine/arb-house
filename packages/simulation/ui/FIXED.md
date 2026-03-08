# Fixed: ModuleNotFoundError for flask_cors

## The Problem

The error occurred because `pip3` was installing packages to a different Python environment than `python3` was using.

## The Solution

Use `python3 -m pip` instead of `pip3` to ensure packages are installed to the same Python interpreter that will run the app.

## Correct Commands

### Install Dependencies:
```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui
python3 -m pip install Flask flask-cors
```

### Run the Server:
```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui
python3 app.py
```

### Or Use the Startup Script:
```bash
cd /Users/midmoussi/bond-aggregation/simulation/ui
./start_server.sh
```

## Why This Happens

- `pip3` might point to a different Python version
- `python3` uses the system's default Python 3
- Using `python3 -m pip` ensures you install to the same Python that runs the script

## Verification

To verify everything works:
```bash
python3 -c "from flask import Flask; from flask_cors import CORS; print('All imports successful!')"
```

If this prints "All imports successful!", you're ready to run the server!

