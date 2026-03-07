'use client'

import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'deposit',
    amount: '10,000',
    token: 'USDC',
    timestamp: '2 mins ago',
    status: 'completed',
    txHash: '0x1234...5678',
  },
  {
    id: 2,
    type: 'withdraw',
    amount: '5,000',
    token: 'USDC',
    timestamp: '1 hour ago',
    status: 'completed',
    txHash: '0x8765...4321',
  },
  {
    id: 3,
    type: 'deposit',
    amount: '25,000',
    token: 'USDC',
    timestamp: '3 hours ago',
    status: 'completed',
    txHash: '0xabcd...efgh',
  },
  {
    id: 4,
    type: 'yield',
    amount: '125.50',
    token: 'USDC',
    timestamp: '5 hours ago',
    status: 'completed',
    description: 'Yield distribution',
  },
]

export function RecentActivity() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <a
          href="/transactions"
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </a>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-void/50 hover:bg-void transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activity.type === 'deposit'
                ? 'bg-accent/10'
                : activity.type === 'withdraw'
                ? 'bg-danger/10'
                : 'bg-warning/10'
            }`}>
              {activity.type === 'deposit' ? (
                <ArrowDownLeft className="w-5 h-5 text-accent" />
              ) : activity.type === 'withdraw' ? (
                <ArrowUpRight className="w-5 h-5 text-danger" />
              ) : (
                <Clock className="w-5 h-5 text-warning" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{activity.type}</span>
                <span className={`font-mono ${
                  activity.type === 'deposit'
                    ? 'text-accent'
                    : activity.type === 'withdraw'
                    ? 'text-danger'
                    : 'text-warning'
                }`}>
                  {activity.type === 'withdraw' ? '-' : '+'}{activity.amount} {activity.token}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                <span>{activity.timestamp}</span>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-accent" />
                  <span className="text-accent">Completed</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
