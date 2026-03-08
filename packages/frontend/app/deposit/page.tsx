import { Metadata } from 'next'
import { DepositForm } from '@/components/deposit/DepositForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Deposit | bond.credit',
}

export default function DepositPage() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Vault
        </Link>
        
        <div className="card p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Deposit USDC
            </h1>
            <p className="text-text-secondary text-sm">
              Deposit USDC to receive BCV shares. Shares represent your proportional ownership of the vault.
            </p>
          </div>
          
          <DepositForm />
        </div>
      </div>
    </main>
  )
}
