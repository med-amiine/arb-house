import { Decimal } from 'decimal.js';

// Set Decimal precision
Decimal.set({ precision: 28 });

const PRECISION = new Decimal('1e18');
const ONE = PRECISION;

export interface Agent {
  name: string;
  adapter: string;
  creditLimit: Decimal;
  currentBalance: Decimal;
  active: boolean;
}

export interface WithdrawalRequest {
  shares: Decimal;
  assets: Decimal;
  timestamp: Date;
  claimed: boolean;
}

export interface User {
  address: string;
  shares: Decimal;
  totalDeposited: Decimal;
  totalWithdrawn: Decimal;
  withdrawalQueue: WithdrawalRequest[];
  pendingAssets: Decimal;
}

export interface Transaction {
  timestamp: Date;
  user: string;
  txType: 'deposit' | 'withdraw';
  amount: Decimal;
  shares: Decimal;
  sharePrice: Decimal;
  totalAssets: Decimal;
  totalShares: Decimal;
}

export class VaultSimulator {
  agents: Agent[];
  totalShares: Decimal;
  idleAssets: Decimal;
  users: Map<string, User>;
  totalPending: Decimal;
  transactions: Transaction[];
  yieldHistory: Array<{ timestamp: Date; totalAssets: Decimal; sharePrice: Decimal }>;
  lastSync: Date;

  constructor() {
    // Initialize 3 agents with credit limits
    this.agents = [
      {
        name: "Agent1",
        adapter: "0x111...",
        creditLimit: new Decimal("100000"),
        currentBalance: new Decimal(0),
        active: true
      },
      {
        name: "Agent2",
        adapter: "0x222...",
        creditLimit: new Decimal("100000"),
        currentBalance: new Decimal(0),
        active: true
      },
      {
        name: "Agent3",
        adapter: "0x333...",
        creditLimit: new Decimal("100000"),
        currentBalance: new Decimal(0),
        active: true
      }
    ];
    this.totalShares = new Decimal(0);
    this.idleAssets = new Decimal(0);
    this.users = new Map();
    this.totalPending = new Decimal(0);
    this.transactions = [];
    this.yieldHistory = [];
    this.lastSync = new Date();
  }

  // Derived accounting
  totalAssets(): Decimal {
    const deployed = this.agents.reduce((sum, agent) => sum.add(agent.currentBalance), new Decimal(0));
    return this.idleAssets.add(deployed);
  }

  sharePrice(): Decimal {
    if (this.totalShares.isZero()) {
      return ONE;
    }
    return this.totalAssets().mul(ONE).div(this.totalShares);
  }

  getTotalDeployed(): Decimal {
    return this.agents.reduce((sum, agent) => sum.add(agent.currentBalance), new Decimal(0));
  }

  // Core mechanics
  deposit(user: string, amount: Decimal): Decimal {
    if (amount.isZero() || amount.isNegative()) {
      throw new Error("Amount must be > 0");
    }

    const price = this.sharePrice();
    const shares = amount.mul(ONE).div(price);

    this.totalShares = this.totalShares.add(shares);
    this.idleAssets = this.idleAssets.add(amount);

    if (!this.users.has(user)) {
      this.users.set(user, {
        address: user,
        shares: new Decimal(0),
        totalDeposited: new Decimal(0),
        totalWithdrawn: new Decimal(0),
        withdrawalQueue: [],
        pendingAssets: new Decimal(0)
      });
    }

    const userObj = this.users.get(user)!;
    userObj.shares = userObj.shares.add(shares);
    userObj.totalDeposited = userObj.totalDeposited.add(amount);

    this.transactions.push({
      timestamp: new Date(),
      user,
      txType: 'deposit',
      amount,
      shares,
      sharePrice: price,
      totalAssets: this.totalAssets(),
      totalShares: this.totalShares
    });

    return shares;
  }

  withdraw(user: string, shares: Decimal): Decimal {
    if (shares.isZero() || shares.isNegative()) {
      throw new Error("Shares must be > 0");
    }

    if (!this.users.has(user) || this.users.get(user)!.shares.lt(shares)) {
      throw new Error("Insufficient shares");
    }

    const assets = shares.mul(this.sharePrice()).div(ONE);

    if (this.idleAssets.lt(assets)) {
      throw new Error("Insufficient idle assets");
    }

    const userObj = this.users.get(user)!;
    userObj.shares = userObj.shares.sub(shares);
    this.totalShares = this.totalShares.sub(shares);
    this.idleAssets = this.idleAssets.sub(assets);
    userObj.totalWithdrawn = userObj.totalWithdrawn.add(assets);

    this.transactions.push({
      timestamp: new Date(),
      user,
      txType: 'withdraw',
      amount: assets,
      shares,
      sharePrice: this.sharePrice(),
      totalAssets: this.totalAssets(),
      totalShares: this.totalShares
    });

    return assets;
  }

  syncBalances(balances: Decimal[]): void {
    for (let i = 0; i < balances.length; i++) {
      if (balances[i].gt(this.agents[i].creditLimit)) {
        throw new Error(`Exceeds credit limit for agent ${i}`);
      }
      this.agents[i].currentBalance = balances[i];
    }
    this.lastSync = new Date();
  }

  applyYield(rate: Decimal): void {
    for (const agent of this.agents) {
      agent.currentBalance = agent.currentBalance.mul(new Decimal(1).add(rate));
    }

    this.yieldHistory.push({
      timestamp: new Date(),
      totalAssets: this.totalAssets(),
      sharePrice: this.sharePrice()
    });
  }

  // UI helpers
  getUserInfo(user: string): any {
    if (!this.users.has(user)) {
      return {
        address: user,
        shares: '0',
        claimableAssets: '0',
        totalDeposited: '0',
        totalWithdrawn: '0',
        netGain: '0'
      };
    }

    const userObj = this.users.get(user)!;
    const currentSharePrice = this.sharePrice();
    const claimable = userObj.shares.mul(currentSharePrice).div(PRECISION);
    const netGain = claimable.sub(userObj.totalDeposited).add(userObj.totalWithdrawn);

    return {
      address: user,
      shares: userObj.shares.toString(),
      claimableAssets: claimable.toString(),
      totalDeposited: userObj.totalDeposited.toString(),
      totalWithdrawn: userObj.totalWithdrawn.toString(),
      netGain: netGain.toString()
    };
  }

  getMetrics(): any {
    const currentSharePrice = this.sharePrice();
    const sharePriceFormatted = currentSharePrice.gt(0) ? currentSharePrice.div(PRECISION).toNumber() : 0;

    return {
      totalAssets: this.totalAssets().toString(),
      totalShares: this.totalShares.toString(),
      sharePrice: currentSharePrice.toString(),
      sharePriceFormatted,
      numUsers: this.users.size,
      numTransactions: this.transactions.length
    };
  }

  getAgents(): any[] {
    return this.agents.map(agent => ({
      name: agent.name,
      assets: agent.currentBalance.toString()
    }));
  }

  getUsers(): any[] {
    return Array.from(this.users.values()).map(user => this.getUserInfo(user.address));
  }

  getRecentTransactions(limit: number = 10): Transaction[] {
    return this.transactions.slice(-limit);
  }
}