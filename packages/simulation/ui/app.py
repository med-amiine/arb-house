"""
Flask web server for the vault simulation UI.
"""
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import threading
import time
from decimal import Decimal
from datetime import datetime
import sys
import os

# Add parent directory to path to import vault_simulator
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
from vault_simulator import VaultSimulator

app = Flask(__name__)
CORS(app)

# Global vault instance
vault = VaultSimulator()
simulation_running = False
yield_thread = None
yield_interval_minutes = 1
yield_rate = Decimal('0.07')
start_time = None
history = []  # Store historical data points


def yield_loop():
    """Background thread that applies yield every interval."""
    global vault, simulation_running, yield_rate, yield_interval_minutes
    
    interval_seconds = yield_interval_minutes * 60
    
    print(f"[YIELD LOOP] Started - will apply {float(yield_rate)*100}% yield every {yield_interval_minutes} minute(s)")
    print(f"[YIELD LOOP] Interval: {interval_seconds} seconds")
    
    yield_count = 0
    first_yield = True
    
    while simulation_running:
        # For first yield, wait the interval. For subsequent yields, wait at the start of the loop
        if not first_yield:
            print(f"[YIELD LOOP] Waiting {interval_seconds} seconds before next yield...")
            time.sleep(interval_seconds)
        else:
            print(f"[YIELD LOOP] First yield will occur in {interval_seconds} seconds...")
            time.sleep(interval_seconds)
            first_yield = False
        
        if not simulation_running:
            print("[YIELD LOOP] Simulation stopped, exiting yield loop")
            break
        
        yield_count += 1
        
        # Sync before yield to ensure accurate state
        vault.sync()
        
        # Get state before yield
        before_assets = vault.total_assets()
        before_shares = vault.total_shares
        share_price_before = vault.share_price()
        share_price_ratio_before = float(share_price_before / Decimal('1e18')) if share_price_before > 0 else 0
        
        # Check if there are any assets to apply yield to
        if before_assets == 0:
            print(f"[YIELD #{yield_count}] Skipping - no assets in vault (total_assets = 0)")
            print(f"  → Make a deposit first to see yield effects")
            continue
        
        print(f"\n{'='*60}")
        print(f"[YIELD EVENT #{yield_count}] - {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")
        print(f"  Before: Assets={before_assets}, Shares={before_shares}, Share Price={share_price_ratio_before:.6f}")
        
        # Check agent assets before yield
        agent_assets_before = [agent.total_assets() for agent in vault.agents]
        print(f"  Agent assets before: {[float(a) for a in agent_assets_before]}")
        print(f"  Sum of agent assets: {sum(agent_assets_before)}")
        
        # Verify cached_total_assets matches
        print(f"  cached_total_assets before: {vault.cached_total_assets}")
        
        # Apply yield (this increases agent assets, which increases total_assets)
        print(f"  Applying {float(yield_rate)*100}% yield to agents...")
        vault.apply_yield(yield_rate)
        
        # Sync after yield to update cached_total_assets
        vault.sync()
        
        # Get state after yield
        after_assets = vault.total_assets()
        after_shares = vault.total_shares
        share_price_after = vault.share_price()
        share_price_ratio_after = float(share_price_after / Decimal('1e18')) if share_price_after > 0 else 0
        
        # Check agent assets after yield
        agent_assets_after = [agent.total_assets() for agent in vault.agents]
        print(f"  Agent assets after: {[float(a) for a in agent_assets_after]}")
        print(f"  Sum of agent assets: {sum(agent_assets_after)}")
        print(f"  cached_total_assets after: {vault.cached_total_assets}")
        
        # Validate: shares should not change, assets should increase, share price should increase
        if after_shares != before_shares:
            print(f"  [WARNING] Shares changed: {before_shares} → {after_shares} (should not change)")
        else:
            print(f"  ✓ Shares unchanged: {before_shares}")
        
        asset_increase = after_assets - before_assets
        expected_increase = before_assets * yield_rate
        
        print(f"  After: Assets={after_assets}, Shares={after_shares}, Share Price={share_price_ratio_after:.6f}")
        print(f"  Asset increase: +{asset_increase} (expected: ~{expected_increase})")
        print(f"  Share price change: {share_price_ratio_before:.6f} → {share_price_ratio_after:.6f}")
        
        # Validate the increase is approximately correct
        if abs(asset_increase - expected_increase) > Decimal('0.01'):
            print(f"  [WARNING] Asset increase doesn't match expected: got {asset_increase}, expected ~{expected_increase}")
        else:
            print(f"  ✓ Asset increase matches expected")
        
        # Validate share price increased
        if share_price_ratio_after <= share_price_ratio_before:
            print(f"  [WARNING] Share price did not increase: {share_price_ratio_before:.6f} → {share_price_ratio_after:.6f}")
        else:
            print(f"  ✓ Share price increased")
        
        # Validate total_assets matches sum of agent assets
        if abs(after_assets - sum(agent_assets_after)) > Decimal('0.0001'):
            print(f"  [WARNING] total_assets ({after_assets}) != sum(agent_assets) ({sum(agent_assets_after)})")
        else:
            print(f"  ✓ total_assets matches sum of agent assets")
        
        print(f"{'='*60}\n")
        
        # Record history
        record_history()


def record_history():
    """Record current state to history."""
    global vault, history
    
    metrics = vault.get_metrics()
    history.append({
        'timestamp': datetime.now().isoformat(),
        'total_assets': float(metrics['total_assets']),
        'total_shares': float(metrics['total_shares']),
        'share_price': metrics['share_price_formatted'],
        'num_users': metrics['num_users']
    })
    
    # Keep only last 100 points
    if len(history) > 100:
        history = history[-100:]


@app.route('/')
def index():
    """Serve the main UI page."""
    return render_template('index.html')


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current vault status."""
    global vault, start_time, simulation_running
    
    try:
        # Sync vault to ensure accurate metrics
        vault.sync()
        metrics = vault.get_metrics()
        
        # Get agent details
        agent_details = []
        for i, agent in enumerate(vault.agents):
            try:
                agent_details.append({
                    'name': agent.name,
                    'assets': str(agent.total_assets())
                })
            except Exception as e:
                print(f"Error getting agent {i} info: {e}")
                agent_details.append({
                    'name': agent.name,
                    'assets': '0'
                })
        
        # Get user details (use user_shares as source of truth)
        user_details = []
        for user_address in vault.user_shares.keys():
            try:
                user_info = vault.get_user_info(user_address)
                user_details.append(user_info)
            except Exception as e:
                # Skip problematic users but log the error
                print(f"Error getting info for user {user_address}: {e}")
                # Add a safe default entry
                user_details.append({
                    'address': user_address,
                    'shares': '0',
                    'claimable_assets': '0',
                    'total_deposited': '0',
                    'total_withdrawn': '0',
                    'net_gain': '0'
                })
        
        return jsonify({
            'metrics': metrics,
            'agents': agent_details,
            'users': user_details,
            'simulation_running': simulation_running,
            'uptime_seconds': int((datetime.now() - start_time).total_seconds()) if start_time else 0,
            'yield_interval_minutes': yield_interval_minutes,
            'yield_rate': float(yield_rate)
        })
    except Exception as e:
        print(f"Error in get_status: {e}")
        import traceback
        traceback.print_exc()
        # Return minimal safe response
        return jsonify({
            'metrics': {
                'total_assets': '0',
                'total_shares': '0',
                'share_price': '1e18',
                'share_price_formatted': 1.0,
                'agent_assets': ['0', '0', '0'],
                'num_users': 0,
                'num_transactions': 0
            },
            'agents': [],
            'users': [],
            'simulation_running': simulation_running,
            'uptime_seconds': 0,
            'yield_interval_minutes': yield_interval_minutes,
            'yield_rate': float(yield_rate),
            'error': str(e)
        }), 500


@app.route('/api/deposit', methods=['POST'])
def deposit():
    """Handle deposit request."""
    global vault
    
    try:
        data = request.json
        user_address = data.get('user', '0xUser' + str(len(vault.users) + 1))
        
        # Get amount and convert to Decimal safely
        amount_raw = data.get('amount', 0)
        if amount_raw is None:
            return jsonify({'error': 'Amount is required'}), 400
        
        try:
            amount = Decimal(str(amount_raw))
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Invalid amount: {amount_raw}. Must be a number.'}), 400
        
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Sync vault before deposit to ensure accurate share price
        vault.sync()
        
        # Get share price before deposit for logging
        share_price_before = vault.share_price()
        share_price_ratio_before = float(share_price_before / Decimal('1e18'))
        
        shares = vault.deposit(user_address, amount)
        
        # Validate: share_price = total_assets / total_shares
        vault.sync()
        share_price_after = vault.share_price()
        share_price_ratio_after = float(share_price_after / Decimal('1e18'))
        
        record_history()
        
        return jsonify({
            'success': True,
            'shares': str(shares),
            'user': user_address,
            'amount': str(amount),
            'share_price_before': share_price_ratio_before,
            'share_price_after': share_price_ratio_after
        })
    except ValueError as e:
        # This catches "Shares too small" and other ValueError exceptions
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Deposit failed: {str(e)}'}), 400


@app.route('/api/withdraw', methods=['POST'])
def withdraw():
    """Handle withdrawal request."""
    global vault
    
    try:
        data = request.json
        user_address = data.get('user')
        shares_str = data.get('shares', 'all')
        
        if not user_address:
            return jsonify({'error': 'User address required'}), 400
        
        # Check user_shares (source of truth) instead of users dict
        user_shares_balance = vault.user_shares.get(user_address, Decimal(0))
        if user_shares_balance == 0:
            return jsonify({'error': 'User not found or has no shares'}), 404
        
        if shares_str == 'all':
            shares_to_burn = user_shares_balance
        else:
            shares_to_burn = Decimal(str(shares_str))
            if shares_to_burn > user_shares_balance:
                return jsonify({'error': 'Insufficient shares'}), 400
        
        # Sync vault before withdrawal to ensure accurate share price
        vault.sync()
        
        # Get share price before withdrawal for validation
        share_price_before = vault.share_price()
        share_price_ratio_before = float(share_price_before / Decimal('1e18'))
        
        # Calculate expected assets: assets_out = shares_burned * share_price
        expected_assets = (shares_to_burn * share_price_before) / Decimal('1e18')
        
        # Perform withdrawal
        assets = vault.withdraw(user_address, shares_to_burn)
        
        # Validate: assets_out should equal shares_burned * share_price (within rounding)
        assets_ratio = float(assets / expected_assets) if expected_assets > 0 else 0
        
        vault.sync()
        share_price_after = vault.share_price()
        share_price_ratio_after = float(share_price_after / Decimal('1e18'))
        
        record_history()
        
        return jsonify({
            'success': True,
            'assets': str(assets),
            'shares': str(shares_to_burn),
            'user': user_address,
            'share_price_before': share_price_ratio_before,
            'share_price_after': share_price_ratio_after,
            'expected_assets': str(expected_assets),
            'assets_ratio': assets_ratio
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get historical data."""
    global history
    return jsonify(history)


@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get transaction history."""
    global vault
    
    transactions = []
    for tx in vault.transactions:
        transactions.append({
            'timestamp': tx.timestamp.isoformat(),
            'user': tx.user,
            'type': tx.tx_type,
            'amount': str(tx.amount),
            'shares': str(tx.shares),
            'share_price': str(tx.share_price),
            'total_assets': str(tx.total_assets),
            'total_shares': str(tx.total_shares)
        })
    
    # Return most recent first
    return jsonify(list(reversed(transactions[-50:])))


@app.route('/api/yield-history', methods=['GET'])
def get_yield_history():
    """Get yield event history."""
    global vault
    
    yield_events = []
    for event in vault.yield_history:
        yield_events.append({
            'timestamp': event['timestamp'].isoformat(),
            'yield_rate': event['yield_rate'],
            'total_assets_before': event['total_assets_before'],
            'total_assets_after': event['total_assets_after'],
            'share_price': event['share_price']
        })
    
    return jsonify(list(reversed(yield_events[-20:])))


@app.route('/api/validate', methods=['GET'])
def validate_invariants():
    """Validate ERC-4626 invariants."""
    global vault
    
    vault.sync()
    
    total_assets = vault.total_assets()
    total_shares = vault.total_shares
    share_price = vault.share_price()
    agent_sum = sum(agent.total_assets() for agent in vault.agents)
    
    # Calculate expected share price
    if total_shares == 0:
        expected_price = Decimal('1e18') if total_assets == 0 else Decimal('0')
    else:
        expected_price = (total_assets * Decimal('1e18')) / total_shares
    
    share_price_ratio = float(share_price / Decimal('1e18')) if share_price > 0 else 0
    expected_price_ratio = float(expected_price / Decimal('1e18')) if expected_price > 0 else 0
    
    # Validation results
    validations = {
        'total_assets': str(total_assets),
        'total_shares': str(total_shares),
        'share_price': share_price_ratio,
        'expected_share_price': expected_price_ratio,
        'share_price_valid': abs(share_price - expected_price) < Decimal('1'),
        'agent_assets_sum': str(agent_sum),
        'agent_sum_equals_total': abs(agent_sum - total_assets) < Decimal('0.0001'),
        'zero_shares_zero_assets': (total_shares == 0) == (total_assets == 0)
    }
    
    all_valid = (
        validations['share_price_valid'] and
        validations['agent_sum_equals_total'] and
        validations['zero_shares_zero_assets']
    )
    
    return jsonify({
        'valid': all_valid,
        'validations': validations
    })


@app.route('/api/start', methods=['POST'])
def start_simulation():
    """Start the simulation."""
    global simulation_running, yield_thread, start_time
    
    if simulation_running:
        return jsonify({'error': 'Simulation already running'}), 400
    
    simulation_running = True
    start_time = datetime.now()
    
    # Start yield thread
    yield_thread = threading.Thread(target=yield_loop, daemon=True)
    yield_thread.start()
    
    print(f"[SIMULATION] Started at {start_time.strftime('%H:%M:%S')}")
    print(f"[SIMULATION] Yield rate: {float(yield_rate)*100}% every {yield_interval_minutes} minute(s)")
    
    record_history()
    
    return jsonify({
        'success': True, 
        'message': 'Simulation started',
        'yield_rate': float(yield_rate),
        'yield_interval_minutes': yield_interval_minutes
    })


@app.route('/api/stop', methods=['POST'])
def stop_simulation():
    """Stop the simulation."""
    global simulation_running
    
    simulation_running = False
    print("[SIMULATION] Stopped")
    return jsonify({'success': True, 'message': 'Simulation stopped'})


@app.route('/api/apply-yield', methods=['POST'])
def apply_yield_manual():
    """Manually apply yield (for testing)."""
    global vault
    
    try:
        vault.sync()
        
        before_assets = vault.total_assets()
        before_shares = vault.total_shares
        share_price_before = vault.share_price()
        share_price_ratio_before = float(share_price_before / Decimal('1e18')) if share_price_before > 0 else 0
        
        if before_assets == 0:
            return jsonify({
                'success': False,
                'error': 'No assets in vault to apply yield to',
                'total_assets': str(before_assets)
            }), 400
        
        # Apply yield
        vault.apply_yield(yield_rate)
        vault.sync()
        
        after_assets = vault.total_assets()
        after_shares = vault.total_shares
        share_price_after = vault.share_price()
        share_price_ratio_after = float(share_price_after / Decimal('1e18')) if share_price_after > 0 else 0
        
        asset_increase = after_assets - before_assets
        
        record_history()
        
        return jsonify({
            'success': True,
            'message': f'Applied {float(yield_rate)*100}% yield',
            'before': {
                'total_assets': str(before_assets),
                'total_shares': str(before_shares),
                'share_price': share_price_ratio_before
            },
            'after': {
                'total_assets': str(after_assets),
                'total_shares': str(after_shares),
                'share_price': share_price_ratio_after
            },
            'increase': {
                'assets': str(asset_increase),
                'percentage': float(asset_increase / before_assets * 100) if before_assets > 0 else 0
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/reset', methods=['POST'])
def reset_simulation():
    """Reset the simulation."""
    global vault, simulation_running, history, start_time
    
    simulation_running = False
    vault = VaultSimulator(num_agents=3)
    history = []
    start_time = None
    
    return jsonify({'success': True, 'message': 'Simulation reset'})


@app.route('/api/demo', methods=['POST'])
def run_demo():
    """Run an automated demo simulation."""
    global vault, simulation_running, history, start_time
    
    # Reset first
    simulation_running = False
    vault = VaultSimulator(num_agents=3)
    history = []
    start_time = datetime.now()
    
    # Start simulation
    simulation_running = True
    yield_thread = threading.Thread(target=yield_loop, daemon=True)
    yield_thread.start()
    
    # Run demo in background thread
    demo_thread = threading.Thread(target=demo_sequence, daemon=True)
    demo_thread.start()
    
    return jsonify({'success': True, 'message': 'Demo started'})


def demo_sequence():
    """
    Run ERC-4626 test scenario:
    - User A deposits 100 at t=0
    - User B deposits 150 at t=10
    - User A withdraws 50 worth at t=20
    - User C deposits 200 at t=30
    - Yield of 7% every 5 minutes
    - All users exit at end
    - Final state: total_assets == 0, total_shares == 0
    """
    global vault, simulation_running
    
    import time
    
    try:
        print("\n" + "="*80)
        print("ERC-4626 TEST SCENARIO")
        print("="*80)
        
        # Record initial state
        record_history()
        vault.sync()
        _print_state("INITIAL STATE")
        time.sleep(1)
        
        # t=0: User A deposits 100
        print("\n[SCENARIO] t=0: User A deposits 100")
        vault.sync()
        shares_a = vault.deposit('0xUserA', Decimal('100'))
        print(f"  → User A received {shares_a} shares")
        _print_state("After User A deposit")
        record_history()
        time.sleep(1)
        
        # t=5: First yield (7%)
        print("\n[SCENARIO] t=5: Apply 7% yield")
        vault.apply_yield(Decimal('0.07'))
        _print_state("After first yield")
        record_history()
        time.sleep(1)
        
        # t=10: User B deposits 150
        print("\n[SCENARIO] t=10: User B deposits 150")
        vault.sync()
        shares_b = vault.deposit('0xUserB', Decimal('150'))
        print(f"  → User B received {shares_b} shares")
        _print_state("After User B deposit")
        record_history()
        time.sleep(1)
        
        # t=15: Second yield (7%)
        print("\n[SCENARIO] t=15: Apply 7% yield")
        vault.apply_yield(Decimal('0.07'))
        _print_state("After second yield")
        record_history()
        time.sleep(1)
        
        # t=20: User A withdraws 50 worth
        print("\n[SCENARIO] t=20: User A withdraws 50 worth")
        vault.sync()
        current_share_price = vault.share_price()
        share_price_ratio = current_share_price / Decimal('1e18')
        print(f"  → Current share price: {float(share_price_ratio):.6f}")
        
        # Calculate shares needed to withdraw 50 worth
        assets_to_withdraw = Decimal('50')
        shares_to_burn = (assets_to_withdraw * Decimal('1e18')) / current_share_price
        shares_to_burn = vault._round_down(shares_to_burn, 18)
        
        user_a_shares = vault.user_shares.get('0xUserA', Decimal(0))
        if shares_to_burn > user_a_shares:
            shares_to_burn = user_a_shares
        
        assets_received = vault.withdraw('0xUserA', shares_to_burn)
        print(f"  → User A burned {shares_to_burn} shares, received {assets_received} assets")
        _print_state("After User A partial withdrawal")
        record_history()
        time.sleep(1)
        
        # t=25: Third yield (7%)
        print("\n[SCENARIO] t=25: Apply 7% yield")
        vault.apply_yield(Decimal('0.07'))
        _print_state("After third yield")
        record_history()
        time.sleep(1)
        
        # t=30: User C deposits 200
        print("\n[SCENARIO] t=30: User C deposits 200")
        vault.sync()
        shares_c = vault.deposit('0xUserC', Decimal('200'))
        print(f"  → User C received {shares_c} shares")
        _print_state("After User C deposit")
        record_history()
        time.sleep(1)
        
        # t=35, 40, 45: More yields
        for i in range(3):
            print(f"\n[SCENARIO] t={35 + i*5}: Apply 7% yield")
            vault.apply_yield(Decimal('0.07'))
            _print_state(f"After yield {i+4}")
            record_history()
            time.sleep(1)
        
        # Final withdrawals: All users exit
        print("\n[SCENARIO] Final: All users withdraw all shares")
        vault.sync()
        _print_state("Before final withdrawals")
        
        # User B withdraws all
        user_b_shares = vault.user_shares.get('0xUserB', Decimal(0))
        if user_b_shares > 0:
            print(f"\n  → User B withdrawing {user_b_shares} shares")
            assets_b = vault.withdraw('0xUserB', user_b_shares)
            print(f"    Received {assets_b} assets")
            record_history()
            time.sleep(0.5)
        
        # User A withdraws remaining
        user_a_shares = vault.user_shares.get('0xUserA', Decimal(0))
        if user_a_shares > 0:
            print(f"\n  → User A withdrawing {user_a_shares} shares")
            assets_a = vault.withdraw('0xUserA', user_a_shares)
            print(f"    Received {assets_a} assets")
            record_history()
            time.sleep(0.5)
        
        # User C withdraws all
        user_c_shares = vault.user_shares.get('0xUserC', Decimal(0))
        if user_c_shares > 0:
            print(f"\n  → User C withdrawing {user_c_shares} shares")
            assets_c = vault.withdraw('0xUserC', user_c_shares)
            print(f"    Received {assets_c} assets")
            record_history()
            time.sleep(0.5)
        
        # Final state validation
        vault.sync()
        _print_state("FINAL STATE")
        
        # Validate ERC-4626 invariants
        print("\n" + "="*80)
        print("VALIDATION")
        print("="*80)
        
        total_assets = vault.total_assets()
        total_shares = vault.total_shares
        share_price = vault.share_price()
        
        print(f"Total Assets: {total_assets}")
        print(f"Total Shares: {total_shares}")
        print(f"Share Price: {share_price / Decimal('1e18')}")
        
        # Check invariants
        if total_shares == 0:
            if total_assets == 0:
                print("✓ PASS: total_shares == 0 and total_assets == 0")
            else:
                print(f"✗ FAIL: total_shares == 0 but total_assets == {total_assets} (should be 0)")
        else:
            calculated_price = (total_assets * Decimal('1e18')) / total_shares
            if abs(share_price - calculated_price) < Decimal('1'):
                print("✓ PASS: share_price == total_assets / total_shares")
            else:
                print(f"✗ FAIL: share_price mismatch. Expected: {calculated_price}, Got: {share_price}")
        
        # User summaries
        print("\n" + "="*80)
        print("USER SUMMARIES")
        print("="*80)
        for user_address in sorted(vault.users.keys()):
            user_info = vault.get_user_info(user_address)
            shares = Decimal(user_info['shares'])
            total_deposited = Decimal(user_info['total_deposited'])
            total_withdrawn = Decimal(user_info['total_withdrawn'])
            claimable = Decimal(user_info['claimable_assets'])
            net_gain = Decimal(user_info['net_gain'])
            
            print(f"\n{user_address}:")
            print(f"  Shares: {shares}")
            print(f"  Total Deposited: {total_deposited}")
            print(f"  Total Withdrawn: {total_withdrawn}")
            print(f"  Claimable Assets: {claimable}")
            print(f"  Net Gain: {net_gain}")
            
            if net_gain > 0:
                print(f"  ✓ User earned yield")
            elif net_gain < 0:
                print(f"  ✗ User lost assets (unexpected)")
        
        # Check agent assets sum to total_assets
        agent_sum = sum(agent.total_assets() for agent in vault.agents)
        if abs(agent_sum - total_assets) < Decimal('0.0001'):
            print(f"\n✓ PASS: sum(agent_assets) == total_assets ({agent_sum})")
        else:
            print(f"\n✗ FAIL: sum(agent_assets) = {agent_sum}, total_assets = {total_assets}")
        
        print("\n" + "="*80)
        print("DEMO SEQUENCE COMPLETE")
        print("="*80)
        
    except Exception as e:
        print(f"\n[DEMO] Error: {e}")
        import traceback
        traceback.print_exc()


def _print_state(label):
    """Helper to print vault state."""
    vault.sync()
    metrics = vault.get_metrics()
    share_price_val = Decimal(metrics['share_price']) / Decimal('1e18')
    print(f"\n  {label}:")
    print(f"    Total Assets: {metrics['total_assets']}")
    print(f"    Total Shares: {metrics['total_shares']}")
    print(f"    Share Price: {float(share_price_val):.6f}")


if __name__ == '__main__':
    # Record initial history
    record_history()
    
    print("="*80)
    print("Vault Simulation UI")
    print("="*80)
    print("Starting web server on http://localhost:5001")
    print("Open your browser to view the UI")
    print("="*80)
    
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)

