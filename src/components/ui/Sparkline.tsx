'use client'

interface SparklineProps {
  data: number[]
  width: number
  height: number
  color: string
}

export default function Sparkline({ data, width, height, color }: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg className="block w-full h-full" aria-hidden="true" />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = 2

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = padY + (1 - (v - min) / range) * (height - padY * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  const gradId = `spark-grad-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block w-full h-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
