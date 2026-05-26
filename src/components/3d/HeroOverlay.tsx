'use client'

import { useMemo } from 'react'
import { useScrollProgress } from './ScrollContext'
import { activeChapterIndex } from './chapters'
import TopMark from './overlay/TopMark'
import ChapterTitle from './overlay/ChapterTitle'
import EditionNote from './overlay/EditionNote'
import ChapterProgress from './overlay/ChapterProgress'
import ScrollHint from './overlay/ScrollHint'

export default function HeroOverlay() {
  const { scrollProgress } = useScrollProgress()
  const chapterIndex = useMemo(() => activeChapterIndex(scrollProgress), [scrollProgress])

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <TopMark />
      <ChapterTitle chapterIndex={chapterIndex} />
      <EditionNote chapterIndex={chapterIndex} />
      <ChapterProgress chapterIndex={chapterIndex} />
      <ScrollHint />
    </div>
  )
}
