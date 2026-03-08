"""
Quick demo of the vault simulation.
"""
from decimal import Decimal
from vault_simulator import VaultSimulator


def main():
    print("="*80)
    print("QUICK VAULT SIMULATION DEMO")
    print("="*80)
    
    # Create vault with 3 agents
    vault = VaultSimulator(num_agents=3)
    
    print("\n[Step 1] User A deposits 100 tokens")
    shares_a = vault.deposit('0xUserA', Decimal('100'))
    print(f"  → User A received {shares_a} shares")
    vault.print_state()
    
    print("\n[Step 2] Apply 7% yield (simulating 5 minutes)")
    vault.apply_yield(Decimal('0.07'))
    print(f"  → Share price increased due to yield")
    vault.print_state()
    
    print("\n[Step 3] User B deposits 150 tokens")
    shares_b = vault.deposit('0xUserB', Decimal('150'))
    print(f"  → User B received {shares_b} shares")
    vault.print_state()
    
    print("\n[Step 4] Apply another 7% yield")
    vault.apply_yield(Decimal('0.07'))
    vault.print_state()
    
    print("\n[Step 5] User A withdraws all shares")
    assets_a = vault.withdraw('0xUserA', shares_a)
    print(f"  → User A received {assets_a} tokens")
    vault.print_state()
    
    print("\n[Step 6] User B withdraws all shares")
    assets_b = vault.withdraw('0xUserB', shares_b)
    print(f"  → User B received {assets_b} tokens")
    vault.print_state()
    
    print("\n" + "="*80)
    print("FINAL USER SUMMARIES")
    print("="*80)
    for user_address in ['0xUserA', '0xUserB']:
        user_info = vault.get_user_info(user_address)
        print(f"\n{user_address}:")
        print(f"  Total Deposited: {user_info['total_deposited']}")
        print(f"  Total Withdrawn: {user_info['total_withdrawn']}")
        print(f"  Net Gain: {user_info['net_gain']}")


if __name__ == "__main__":
    main()

