"""
Interactive simulation with real-time user input.

Allows users to deposit/withdraw in real-time while yield is generated every 5 minutes.
"""
import threading
import time
from decimal import Decimal
from datetime import datetime, timedelta
from vault_simulator import VaultSimulator


class InteractiveSimulator:
    """Interactive simulation with background yield generation."""
    
    def __init__(self, yield_interval_minutes: int = 5, yield_rate: float = 0.07):
        self.vault = VaultSimulator(num_agents=3)
        self.yield_interval_minutes = yield_interval_minutes
        self.yield_rate = Decimal(str(yield_rate))
        self.running = False
        self.yield_thread = None
        self.start_time = None
    
    def start(self):
        """Start the simulation with background yield generation."""
        self.running = True
        self.start_time = datetime.now()
        
        print("="*80)
        print("INTERACTIVE VAULT SIMULATION")
        print("="*80)
        print(f"Yield: {float(self.yield_rate)*100}% every {self.yield_interval_minutes} minutes")
        print(f"Agents: 3 (equal allocation)")
        print("="*80)
        print("\nCommands:")
        print("  deposit <user> <amount>  - Deposit tokens")
        print("  withdraw <user> <shares>  - Withdraw shares")
        print("  withdraw-all <user>      - Withdraw all shares")
        print("  status                   - Show vault status")
        print("  user <address>           - Show user info")
        print("  sync                     - Manually sync")
        print("  quit                     - Exit simulation")
        print("="*80)
        
        # Start yield thread
        self.yield_thread = threading.Thread(target=self._yield_loop, daemon=True)
        self.yield_thread.start()
        
        # Main input loop
        self._input_loop()
    
    def _yield_loop(self):
        """Background thread that applies yield every interval."""
        interval_seconds = self.yield_interval_minutes * 60
        
        while self.running:
            time.sleep(interval_seconds)
            
            if not self.running:
                break
            
            print(f"\n[YIELD EVENT] - {datetime.now().strftime('%H:%M:%S')}")
            print(f"Applying {float(self.yield_rate)*100}% yield to all agents...")
            
            before_assets = self.vault.cached_total_assets
            self.vault.apply_yield(self.yield_rate)
            after_assets = self.vault.total_assets()
            
            print(f"Total Assets: {before_assets} → {after_assets}")
            print(f"Increase: {after_assets - before_assets}")
            self.vault.print_state()
    
    def _input_loop(self):
        """Main input loop for user commands."""
        while self.running:
            try:
                command = input("\n> ").strip().split()
                
                if not command:
                    continue
                
                cmd = command[0].lower()
                
                if cmd == 'quit' or cmd == 'exit':
                    self.running = False
                    print("Stopping simulation...")
                    break
                
                elif cmd == 'deposit':
                    if len(command) < 3:
                        print("Usage: deposit <user> <amount>")
                        continue
                    
                    user = command[1]
                    try:
                        amount = Decimal(command[2])
                        shares = self.vault.deposit(user, amount)
                        print(f"✓ Deposited {amount} tokens, received {shares} shares")
                        self.vault.print_state()
                    except Exception as e:
                        print(f"✗ Error: {e}")
                
                elif cmd == 'withdraw':
                    if len(command) < 3:
                        print("Usage: withdraw <user> <shares>")
                        continue
                    
                    user = command[1]
                    try:
                        if command[2].lower() == 'all':
                            if user not in self.vault.users:
                                print(f"✗ User {user} not found")
                                continue
                            user_obj = self.vault.users[user]
                            if user_obj.shares == 0:
                                print(f"✗ User has no shares")
                                continue
                            assets = self.vault.withdraw(user, user_obj.shares)
                            print(f"✓ Withdrew all shares, received {assets} tokens")
                        else:
                            shares = Decimal(command[2])
                            assets = self.vault.withdraw(user, shares)
                            print(f"✓ Withdrew {shares} shares, received {assets} tokens")
                        self.vault.print_state()
                    except Exception as e:
                        print(f"✗ Error: {e}")
                
                elif cmd == 'withdraw-all':
                    if len(command) < 2:
                        print("Usage: withdraw-all <user>")
                        continue
                    
                    user = command[1]
                    try:
                        if user not in self.vault.users:
                            print(f"✗ User {user} not found")
                            continue
                        user_obj = self.vault.users[user]
                        if user_obj.shares == 0:
                            print(f"✗ User has no shares")
                            continue
                        assets = self.vault.withdraw(user, user_obj.shares)
                        print(f"✓ Withdrew all shares, received {assets} tokens")
                        self.vault.print_state()
                    except Exception as e:
                        print(f"✗ Error: {e}")
                
                elif cmd == 'status':
                    self.vault.print_state()
                
                elif cmd == 'user':
                    if len(command) < 2:
                        print("Usage: user <address>")
                        continue
                    
                    user_info = self.vault.get_user_info(command[1])
                    print(f"\nUser: {user_info['address']}")
                    print(f"  Shares: {user_info['shares']}")
                    print(f"  Total Deposited: {user_info['total_deposited']}")
                    print(f"  Total Withdrawn: {user_info['total_withdrawn']}")
                    print(f"  Claimable Assets: {user_info['claimable_assets']}")
                    print(f"  Net Gain: {user_info['net_gain']}")
                
                elif cmd == 'sync':
                    self.vault.sync()
                    print("✓ Synced vault state")
                    self.vault.print_state()
                
                else:
                    print(f"Unknown command: {cmd}")
                    print("Commands: deposit, withdraw, withdraw-all, status, user, sync, quit")
            
            except KeyboardInterrupt:
                self.running = False
                print("\nStopping simulation...")
                break
            except Exception as e:
                print(f"Error: {e}")


if __name__ == "__main__":
    simulator = InteractiveSimulator(yield_interval_minutes=5, yield_rate=0.07)
    simulator.start()

