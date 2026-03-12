# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"베스트 슈터 (Best Shooter)" — 커비 테마의 세로 스크롤 슈팅 게임. 단일 `index.html` 파일(~4200줄)에 HTML5 Canvas + vanilla JavaScript로 구현된 자체 완결형 웹 게임이다.

## Running

브라우저에서 `index.html`을 직접 열면 실행된다. 빌드 도구, 번들러, 패키지 매니저 없음. 이미지 파일들은 같은 디렉토리에 한글 파일명으로 존재하며 `encodeURI()`로 로드한다.

## Architecture

모든 코드가 `index.html` 내 단일 `<script>` 블록에 존재한다. 주요 구조:

### Canvas & Constants
- 캔버스 크기: 480x720 (W, H)
- CSS로 반응형 스케일링 적용 (`min(95vw, 67.5vh)`)

### Game State Machine
`state` 변수로 관리: `title` → `stageIntro` → `playing` → `boss` → `stageClear` → (다음 스테이지 또는 `victory`)
- `gameOver`: HP 소진 시
- 10개 스테이지: Stage 1 (메타나이트) → 2 (기간트 에지) → 3 (다크 매터) → 4 (마르크) → 5 (제로) → 6 (마버로아) → 7 (디디디대왕) → 8 (어나더 나이트메어) → 9 (킹D마인드) → 10 (마스터 크라운)

### Core Systems (코드 순서)
1. **Input** (~L40): `keys`/`justPressed` 객체로 키보드 입력 관리
2. **Audio** (~L50): Web Audio API로 효과음 + BGM 생성 (oscillator 기반, 외부 파일 없음)
3. **Image Loading** (~L110): 7개 이미지 파일을 `images` 객체에 로드
4. **Character Drawing** (~L193): 각 캐릭터를 Canvas 2D로 직접 그리는 함수들 (`drawKirby`, `drawWaddleDee`, `drawHotHead`, `drawWaterGalbros`, `drawMechaWaddleDee`, `drawMetaKnight`, `drawGigantEdge`)
5. **Game Init** (~L845): `initGame()`, `startGame()`, `startStage()`
6. **Enemy Spawning** (~L883): `spawnEnemy()`, `spawnFormation()`, 타이머 기반 웨이브 시스템 (`spawnWave()` ~L939)
7. **Boss Logic** (~L1008): 보스별 상태 머신 (`enter` → `idle` → 공격 패턴 순환)
8. **Player Update** (~L1044): 이동(방향키/WASD), 발사(Z/Space), 흡입(X)
9. **Collision** (~L1453): AABB 충돌 (`rectsOverlap`), 아이템 획득, 피격 처리
10. **Main Loop** (~L1889): `requestAnimationFrame` 기반, 상태별 분기

### Game Mechanics
- **능력 시스템**: 적을 흡입(X키)하면 해당 적의 능력 획득 — `fire`(관통, 고데미지), `water`(3방향 확산)
- **적 종류**: waddledee(일반), hothead(fire 능력), watergalbros(water 능력), mechawaddledee(기계)
- **보스 패턴**: 각 보스 HP 40% 이하 시 phase 2 진입 (새 패턴 추가 + 기존 패턴 강화). 10개 보스 각각 3~4개 공격 패턴 보유
- **아이템**: health(토마토), star(점수) — 적 처치 시 확률 드롭

### Asset Files
한글 파일명 이미지 7개 (같은 디렉토리):
- `기본_워프스타를 탄 커비.jpeg` — 플레이어
- `적_기본_*.jpeg/png` — 일반 적 4종
- `적_보스_*.jpeg` — 보스 2종

## Key Conventions
- 모든 UI 텍스트는 한국어
- 좌표계: 좌상단 원점, y축 아래로 증가
- 엔티티는 중심 좌표(x,y) + 크기(w,h) 구조
- 파티클 시스템으로 시각 피드백 (폭발, 별, 흡입 등)
- 화면 흔들림(`screenShake`)으로 타격감 표현
