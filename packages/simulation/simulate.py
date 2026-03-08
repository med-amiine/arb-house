"""
Main simulation script.

Simulates the vault system with:
- User deposits and withdrawals at random times
- 3 agents receiving equal capital allocation
- 7% yield generated every 5 minutes
"""
import time
import random
from decimal import Decimal
from datetime import datetime, timedelta
from vault_simulator import VaultSimulator


def simulate_vault(
    duration_minutes: int = 60,
    yield_interval_minutes: int = 5,
    yield_rate: float = 0.07,
    user_actions: list = None
):
    """
    Run the vault simulation.
    
    Args:
        duration_minutes: Total simulation duration in minutes
        yield_interval_minutes: Interval between yield applications (minutes)
        yield_rate: Yield rate per interval (e.g., 0.07 for 7%)
        user_actions: List of user actions to execute
                     Format: [{'time': minutes, 'user': 'address', 'action': 'deposit'/'withdraw', 'amount': Decimal}]
    """
    print("="*80)
    print("VAULT SYSTEM SIMULATION")
    print("="*80)
    print(f"Duration: {duration_minutes} minutes")
    print(f"Yield: {yield_rate*100}% every {yield_interval_minutes} minutes")
    print(f"Agents: 3 (equal allocation)")
    print("="*80)
    
    vault = VaultSimulator(num_agents=3)
    start_time = datetime.now()
    simulation_end = start_time + timedelta(minutes=duration_minutes)
    
    # Track next yield time
    next_yield_time = start_time + timedelta(minutes=yield_interval_minutes)
    
    # Process user actions
    if user_actions:
        user_actions.sort(key=lambda x: x['time'])
        action_index = 0
    
    print("\n[INITIAL STATE]")
    vault.print_state()
    
    # Simulation loop
    current_time = start_time
    step = 0
    
    while current_time < simulation_end:
        step += 1
        
        # Apply yield if it's time
        if current_time >= next_yield_time:
            print(f"\n[YIELD EVENT #{step}] - {current_time.strftime('%H:%M:%S')}")
            print(f"Applying {yield_rate*100}% yield to all agents...")
            
            before_assets = vault.cached_total_assets
            vault.apply_yield(Decimal(str(yield_rate)))
            after_assets = vault.total_assets()
            
            print(f"Total Assets: {before_assets} → {after_assets}")
            print(f"Increase: {after_assets - before_assets}")
            vault.print_state()
            
            next_yield_time += timedelta(minutes=yield_interval_minutes)
        
        # Process user actions at this time
        if user_actions:
            while action_index < len(user_actions):
                action = user_actions[action_index]
                action_time = start_time + timedelta(minutes=action['time'])
                
                if action_time > current_time:
                    break
                
                if action_time <= current_time:
                    print(f"\n[USER ACTION] - {action_time.strftime('%H:%M:%S')}")
                    print(f"User: {action['user']}")
                    print(f"Action: {action['action']}")
                    print(f"Amount: {action['amount']}")
                    
                    try:
                        if action['action'] == 'deposit':
                            shares = vault.deposit(action['user'], action['amount'])
                            print(f"✓ Deposited {action['amount']} tokens, received {shares} shares")
                        elif action['action'] == 'withdraw':
                            # Withdraw all shares if 'all' specified
                            if action['amount'] == 'all':
                                user = vault.users.get(action['user'])
                                if user and user.shares > 0:
                                    assets = vault.withdraw(action['user'], user.shares)
                                    print(f"✓ Withdrew all shares, received {assets} tokens")
                                else:
                                    print(f"✗ No shares to withdraw")
                            else:
                                # Calculate shares from amount
                                share_price = vault.share_price()
                                shares = (action['amount'] * Decimal('1e18')) / share_price
                                assets = vault.withdraw(action['user'], shares)
                                print(f"✓ Withdrew {shares} shares, received {assets} tokens")
                        
                        vault.print_state()
                    except Exception as e:
                        print(f"✗ Error: {e}")
                    
                    action_index += 1
        
        # Advance time (in real simulation, this would be actual time)
        # For this simulation, we'll process events in order
        if user_actions and action_index < len(user_actions):
            next_action_time = start_time + timedelta(minutes=user_actions[action_index]['time'])
            current_time = min(next_yield_time, next_action_time, simulation_end)
        else:
            current_time = min(next_yield_time, simulation_end)
        
        # Small delay for readability
        if step <= 10:  # Only delay for first few steps
            time.sleep(0.1)
    
    # Final state
    print("\n" + "="*80)
    print("FINAL STATE")
    print("="*80)
    vault.print_state()
    
    # User summaries
    print("\n" + "="*80)
    print("USER SUMMARIES")
    print("="*80)
    for user_address in vault.users:
        user_info = vault.get_user_info(user_address)
        print(f"\nUser: {user_address}")
        print(f"  Shares: {user_info['shares']}")
        print(f"  Total Deposited: {user_info['total_deposited']}")
        print(f"  Total Withdrawn: {user_info['total_withdrawn']}")
        print(f"  Claimable Assets: {user_info['claimable_assets']}")
        print(f"  Net Gain: {user_info['net_gain']}")
    
    # Yield history
    print("\n" + "="*80)
    print("YIELD HISTORY")
    print("="*80)
    for i, yield_event in enumerate(vault.yield_history, 1):
        print(f"\nYield Event #{i} - {yield_event['timestamp'].strftime('%H:%M:%S')}")
        print(f"  Rate: {yield_event['yield_rate']*100}%")
        print(f"  Assets: {yield_event['total_assets_before']} → {yield_event['total_assets_after']}")
        print(f"  Share Price: {yield_event['share_price']:.6f}")
    
    return vault


def example_simulation():
    """Run an example simulation with predefined user actions."""
    from decimal import Decimal
    
    # Define user actions
    user_actions = [
        # User A deposits 100 tokens at start
        {'time': 0, 'user': '0xUserA', 'action': 'deposit', 'amount': Decimal('100')},
        
        # Yield happens at 5 minutes
        
        # User B deposits 150 tokens at 10 minutes
        {'time': 10, 'user': '0xUserB', 'action': 'deposit', 'amount': Decimal('150')},
        
        # Yield happens at 10 minutes (after User B deposit)
        
        # User A withdraws 50 shares worth at 20 minutes
        {'time': 20, 'user': '0xUserA', 'action': 'withdraw', 'amount': Decimal('50')},
        
        # Yield happens at 15, 20, 25 minutes...
        
        # User C deposits 200 tokens at 30 minutes
        {'time': 30, 'user': '0xUserC', 'action': 'deposit', 'amount': Decimal('200')},
        
        # User B withdraws all at 40 minutes
        {'time': 40, 'user': '0xUserB', 'action': 'withdraw', 'amount': 'all'},
        
        # User A withdraws all at 50 minutes
        {'time': 50, 'user': '0xUserA', 'action': 'withdraw', 'amount': 'all'},
        
        # User C withdraws all at 55 minutes
        {'time': 55, 'user': '0xUserC', 'action': 'withdraw', 'amount': 'all'},
    ]
    
    vault = simulate_vault(
        duration_minutes=60,
        yield_interval_minutes=5,
        yield_rate=0.07,
        user_actions=user_actions
    )
    
    return vault


if __name__ == "__main__":
    # Run example simulation
    example_simulation()

