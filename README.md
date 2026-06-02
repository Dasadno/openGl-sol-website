<div align="center">

# SolanaDefi — «Финансы будущего»

**Кинематографичный scroll-driven лендинг для финтех-продукта на Solana.**
Камера летит по спирали сквозь девять «глав», проходя путь от логотипа в космосе до торгового терминала — целиком в WebGL.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r171-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![R3F](https://img.shields.io/badge/React_Three_Fiber-9.x-black)](https://r3f.docs.pmnd.rs/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

![Hero](docs/screenshots/hero.png)

</div>

---

## Содержание

- [О проекте](#о-проекте)
- [Демо и скриншоты](#демо-и-скриншоты)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Как это устроено](#как-это-устроено)
- [Дизайн-система](#дизайн-система)
- [Производительность и доступность](#производительность-и-доступность)
- [Кастомизация](#кастомизация)
- [Лицензия](#лицензия)

---

## О проекте

`SolanaDefi` — это одностраничный лендинг, построенный вокруг единственной непрерывной 3D-сцены. Вместо привычных «секций» страница представляет собой **сторителлинг через прокрутку**: пользователь скроллит, а виртуальная камера облётает по спиральной траектории логотип Solana, проходя через девять смысловых глав — от метафоры «капитала, движущегося со скоростью света» до финального торгового терминала.

Весь рендер происходит в одном `<Canvas>` (React Three Fiber) поверх «липкого» (`sticky`) вьюпорта, а длинный контейнер высотой `2250vh` служит «дорожкой прокрутки», которая управляет позицией камеры и анимациями. Поверх 3D-сцены наложен типографический оверлей на Framer Motion с живыми данными о цене SOL.

> Проект демонстрирует, как собрать «премиальный» интерактив уровня дизайн-студии на современном стеке Next.js + Three.js, не превращая его в неподъёмный бандл.

---

## Демо и скриншоты

```bash
npm run dev   # → http://localhost:3000
```

> Сайт разделен на сцены, здесь будет показан их внешний вид

Сцена N1 
<img width="2742" height="1609" alt="image" src="https://github.com/user-attachments/assets/3ef6af63-ea88-4acc-b788-6dc27630d7eb" />
Сцена N2 
<img width="2751" height="1630" alt="image" src="https://github.com/user-attachments/assets/0b50d704-75b2-44ce-bc2d-a2867e73060a" />
Сцена N3 
<img width="2781" height="1626" alt="image" src="https://github.com/user-attachments/assets/5b095964-157a-42d4-83ff-d114d1630fe5" />
Сцена N4 
<img width="2775" height="1636" alt="image" src="https://github.com/user-attachments/assets/55f9dce8-c26e-4626-aee7-e876e4a3a452" />
Сцена N5
<img width="2797" height="1642" alt="image" src="https://github.com/user-attachments/assets/39c8151b-cb4e-4657-8599-17052b00cc5d" />
Сцена N6 
<img width="2785" height="1672" alt="image" src="https://github.com/user-attachments/assets/14ce677d-e218-4471-85f2-85248984af62" />
Сцена N7
<img width="2761" height="1606" alt="image" src="https://github.com/user-attachments/assets/5a4ddfee-6b0a-442d-b72d-a45b8596b32f" />





| Глава | Кадр | Что показывает |
|-------|------|----------------|
| 01 · The Speed of Capital | ![](docs/screenshots/hero.png) | Логотип Solana в космосе, hero-заголовок, тикер цены |
| 03 · Liquidity in motion | ![](docs/screenshots/chapter-liquidity.png) | Сеть ликвидности, статистика TVL/объёмов |
| 05 · Throughput | ![](docs/screenshots/chapter-throughput.png) | Поток частиц / bar-chart пропускной способности |
| 06 · Institutional control | ![](docs/screenshots/chapter-institutional.png) | Лента транзакций, аудиты и отчётность |
| 07 · The Lattice within | ![](docs/screenshots/chapter-tunnel.png) | Raymarched-туннель (cutscene-полёт) |
| 09 · The View | ![](docs/screenshots/chapter-terminal.png) | Финальный торговый терминал |

---

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Фреймворк | **Next.js 16.2** (App Router, Turbopack), **React 19.2** |
| 3D | **Three.js r171**, **@react-three/fiber 9**, **@react-three/drei 10** |
| Постобработка | **@react-three/postprocessing 3** + **postprocessing 6** |
| Анимация UI | **Framer Motion 12** |
| Стили | **Tailwind CSS v4** (`@tailwindcss/postcss`), CSS-токены в OKLCH |
| Иконки | **lucide-react** |
| Язык | **TypeScript 5** |
| Данные | **CoinGecko API** (цена SOL) |
| Шрифты | Clash Display, Satoshi, Instrument Serif, JetBrains Mono |

---

## Быстрый старт

**Требования:** Node.js 18+ и GPU с поддержкой WebGL2 (сцена тяжёлая — программный рендеринг не тянет постобработку).

```bash
# установка зависимостей
npm install

# режим разработки (Turbopack)
npm run dev

# продакшн-сборка
npm run build
npm run start

# линтинг
npm run lint
```

Откройте [http://localhost:3000](http://localhost:3000) и прокручивайте страницу вниз — камера сама поведёт вас по сюжету.

---

## Структура проекта

```
saas-landing/
├── public/
│   └── models/solana_logo.glb        # 3D-модель логотипа
├── src/
│   ├── app/
│   │   ├── layout.tsx                # метаданные, lang="ru"
│   │   ├── page.tsx                  # точка входа → WebGLSceneWrapper
│   │   └── globals.css               # Tailwind v4 + дизайн-токены (OKLCH)
│   ├── hooks/
│   │   └── useSolPrice.ts            # данные CoinGecko + форматтеры
│   └── components/
│       ├── 3d/
│       │   ├── WebGLSceneWrapper.tsx # dynamic import (ssr: false)
│       │   ├── WebGLScene.tsx        # Canvas, свет, EffectComposer
│       │   ├── ScrollContext.tsx     # прогресс прокрутки → ref/state
│       │   ├── chapters.ts           # 9 глав + математика спирали
│       │   ├── CameraRig.tsx         # интерполяция камеры, blur-cut, FOV
│       │   ├── CutsceneController.tsx# авто-скролл «vortex»
│       │   ├── HeroLogo.tsx          # GLB-логотип, billboard + spring
│       │   ├── BackgroundFX.tsx      # фоновые эффекты
│       │   ├── OrbitalGlow.tsx       # орбитальное свечение
│       │   ├── LiquidityNetwork.tsx  # сеть ликвидности
│       │   ├── ParticleStream.tsx    # поток частиц (throughput)
│       │   ├── RippleRings.tsx       # расходящиеся кольца
│       │   ├── BarChart.tsx          # 3D-столбчатая диаграмма
│       │   ├── Lattice.tsx           # решётка (глава 7)
│       │   ├── tunnel/               # raymarched-туннель + шейдеры
│       │   ├── overlay/              # TopMark, ChapterTitle, прогресс…
│       │   ├── HeroOverlay.tsx       # оверлей hero + статистика
│       │   ├── LiquidityOverlay.tsx  # оверлей ликвидности
│       │   └── TransactionsOverlay.tsx# лента транзакций
│       └── ui/
│           ├── AnimatedCounter.tsx   # анимированные счётчики
│           └── Sparkline.tsx         # мини-график цены
```

> ⚠️ В проекте используется кастомная сборка Next.js: смотрите `AGENTS.md` — перед правками сверяйтесь с гайдами в `node_modules/next/dist/docs/`, API могут отличаться от привычных.

---

## Как это устроено

### 1. Прокрутка → прогресс

[`WebGLScene`](src/components/3d/WebGLScene.tsx) рендерит контейнер высотой `2250vh`, внутри которого `sticky`-вьюпорт во весь экран. [`ScrollProvider`](src/components/3d/ScrollContext.tsx) слушает `scroll` и переводит позицию в нормализованный прогресс `0..1`, который хранится **и в `ref`** (для чтения в `useFrame` без ре-рендеров), **и в `state`** (для React-оверлеев).

### 2. Прогресс → камера

[`chapters.ts`](src/components/3d/chapters.ts) описывает 9 глав. Функция `spiralKey(θ, r, h, fov)` раскладывает каждый кадр в точку спирали: `position = (r·sinθ, h, r·cosθ)`. [`CameraRig`](src/components/3d/CameraRig.tsx) посегментно интерполирует камеру (а не одной кривой Catmull-Rom — иначе далёкий кадр главы 7 ломает равномерность сегментов) и реализует три режима движения: обычный lerp, вход в `blur-cut` через квадратичную кривую Безье и «удержание + дыхание FOV» внутри туннеля.

### 3. Глава 7 → cutscene + raymarching

При прокрутке до `triggerProgress ≈ 0.75` [`CutsceneController`](src/components/3d/CutsceneController.tsx) перехватывает управление: блокирует колесо/тач/клавиши и за 7 секунд программно докручивает `scrollY` до `endProgress ≈ 0.892` с `easeOutCubic`. Это «провозит» зрителя сквозь [`RaymarchedTunnel`](src/components/3d/tunnel/RaymarchedTunnel.tsx) — полноэкранный SDF-шейдер с фрактальными складками, у которого собственная виртуальная камера, а реальный FOV прокидывается в него юниформом.

### 4. Оверлеи и данные

Поверх Canvas лежат `pointer-events-none` слои на Framer Motion. `activeChapterIndex(scroll)` решает, какой заголовок показать. Хук [`useSolPrice`](src/hooks/useSolPrice.ts) раз в минуту обновляет рыночные данные SOL из CoinGecko, которые рисуются в hero-тикере, лентах и sparkline.

---

## Дизайн-система

Определена в [`globals.css`](src/app/globals.css):

- **Палитра OKLCH** с единым оттенком `hue 290` (фирменный фиолетовый Solana), проложенным сквозь все нейтрали — `--bg-*`, `--surface`, `--text-*`, `--accent`, плюс `--pos`/`--neg` для роста/падения.
- **Градиент Solana** `#9945FF → #14F195` для логотипа и primary-кнопок.
- **Типографика:** Clash Display (дисплейные заголовки), Satoshi (текст), Instrument Serif (курсивные акценты в `<em>`), JetBrains Mono (числа и метки).
- **Easing-кривые** (`--ease-out-strong`, `--ease-drawer`) и утилиты `.backdrop-blur-glass`, `.btn-primary/secondary`, `.gradient-text`.
- **Тон рендера:** ACES Filmic tone mapping, фон `#06060a`, объёмный fog.

---

## Производительность и доступность

- `dpr={[1, 1.75]}` — ограничение pixel ratio под Retina без перегруза.
- `antialias: false` + `multisampling: 4` на уровне `EffectComposer` — AA там, где он дешевле.
- `<Preload all />` и `useGLTF.preload` — прогрев ассетов до показа.
- Raymarcher с бюджетом `MAX_STEPS=72` (комментарии в шейдере подсказывают, как снизить для мобильных).
- `WebGLSceneWrapper` использует `dynamic(..., { ssr: false })` — WebGL не выполняется на сервере.
- `prefers-reduced-motion: reduce` — отключает cutscene, анимации градиента и переходы.

---

## Кастомизация

| Хочу… | Где править |
|-------|-------------|
| Изменить тексты / число глав | `src/components/3d/chapters.ts` |
| Перестроить траекторию камеры | `spiralKey(...)` и `cameraKeyframe` в `chapters.ts` |
| Настроить длину прокрутки | `SCROLL_LENGTH_VH` в `WebGLScene.tsx` |
| Подкрутить постобработку | блок `EffectComposer` в `WebGLScene.tsx` |
| Поменять момент/длительность cutscene | пропсы `CutsceneController` (`triggerProgress`, `endProgress`, `durationMs`) |
| Сменить источник цены | `useSolPrice.ts` (сейчас CoinGecko) |
| Поправить палитру/шрифты | токены в `globals.css` |
| Заменить 3D-логотип | `public/models/solana_logo.glb` + масштаб в `HeroLogo.tsx` |

---

## Лицензия

Учебный / демонстрационный проект. Уточните условия использования у автора репозитория.

---

<div align="center">
<sub>Собрано на Next.js · React Three Fiber · Framer Motion</sub>
</div>
