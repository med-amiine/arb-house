'use client'

import { useState, useEffect } from 'react'
import { useKeeperConfig } from '@/hooks/useKeeper'
import { Settings, Check, AlertCircle } from 'lucide-react'

export function KeeperSettings() {
  const { apiUrl, updateApiUrl } = useKeeperConfig()
  const [inputUrl, setInputUrl] = useState(apiUrl)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputUrl(apiUrl)
  }, [apiUrl])

  const handleSave = async () => {
    setTesting(true)
    setError(null)
    
    try {
      // Test the connection
      const response = await fetch(`${inputUrl}/`)
      if (response.ok) {
        updateApiUrl(inputUrl)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Reload page to use new URL
        window.location.reload()
      } else {
        setError('Keeper service returned an error')
      }
    } catch (err) {
      setError('Cannot connect to keeper service')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-text-secondary" />
        <h3 className="text-sm font-medium">Keeper API Settings</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">
            API URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 px-3 py-2 bg-void border border-border rounded-lg text-sm"
            />
            <button
              onClick={handleSave}
              disabled={testing || inputUrl === apiUrl}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {testing ? 'Testing...' : saved ? <Check className="w-4 h-4" /> : 'Save'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-danger text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
        
        <p className="text-xs text-text-muted">
          Current: {apiUrl}
        </p>
        
        <div className="text-xs text-text-muted space-y-1">
          <p>Quick presets:</p>
          <div className="flex gap-2">
            {['8000', '8004', '8080'].map((port) => (
              <button
                key={port}
                onClick={() => setInputUrl(`http://localhost:${port}`)}
                className="px-2 py-1 bg-void rounded text-xs hover:bg-surface-hover"
              >
                :{port}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
