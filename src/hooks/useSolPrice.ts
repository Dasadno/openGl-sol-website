'use client'

import { useEffect, useState } from 'react'

export interface SolPriceData {
  price: number | null
  change24h: number | null
  high24h: number | null
  low24h: number | null
  marketCap: number | null
  volume24h: number | null
  circulatingSupply: number | null
  sparkline7d: number[]
  loading: boolean
}

const INITIAL: SolPriceData = {
  price: null,
  change24h: null,
  high24h: null,
  low24h: null,
  marketCap: null,
  volume24h: null,
  circulatingSupply: null,
  sparkline7d: [],
  loading: true,
}

export function useSolPrice(): SolPriceData {
  const [data, setData] = useState<SolPriceData>(INITIAL)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/solana?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true'
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        const m = json.market_data
        setData({
          price: m.current_price?.usd ?? null,
          change24h: m.price_change_percentage_24h ?? null,
          high24h: m.high_24h?.usd ?? null,
          low24h: m.low_24h?.usd ?? null,
          marketCap: m.market_cap?.usd ?? null,
          volume24h: m.total_volume?.usd ?? null,
          circulatingSupply: m.circulating_supply ?? null,
          sparkline7d: m.sparkline_7d?.price ?? [],
          loading: false,
        })
      } catch {
        if (cancelled) return
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchData()
    const id = setInterval(fetchData, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return data
}

export function formatCurrency(n: number | null | undefined, abbreviated = false): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (abbreviated) {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
    return `$${n.toFixed(2)}`
  }
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export function formatNumber(n: number | null | undefined, abbreviated = false): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  if (abbreviated) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
    return n.toFixed(0)
  }
  return n.toLocaleString('en-US')
}
