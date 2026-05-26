'use client'

import dynamic from 'next/dynamic'

const WebGLScene = dynamic(() => import('./WebGLScene'), { ssr: false })

export default function WebGLSceneWrapper() {
  return <WebGLScene />
}
