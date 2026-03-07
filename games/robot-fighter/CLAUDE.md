# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

"우주 로봇 파이터" - Three.js(r128) 기반 3D 웹 게임. 단일 파일(`index.html`, ~2450줄)로 구성되며, HTML/CSS/JS가 모두 하나의 파일에 포함되어 있다. 별도 빌드 도구나 패키지 매니저 없이 브라우저에서 직접 실행 가능.

## 실행 방법

로컬 서버로 `index.html`을 열면 된다. 예: `open index.html` 또는 `python3 -m http.server`.

## 코드 구조 (index.html 내부)

파일은 크게 다음 섹션으로 나뉜다 (주석 `// ===` 구분자 사용):

| 라인 범위 | 섹션 | 설명 |
|-----------|------|------|
| 1-165 | CSS/HTML | HUD, 상점, 업그레이드 패널, 시작/게임오버 화면 |
| 234-278 | `G` 객체 | 전체 게임 상태 (HP, 코인, 스테이지, 적/유닛/총알 배열 등) |
| 283-638 | `SFX` 객체 | Web Audio API 기반 절차적 사운드 합성 (BGM 포함) |
| 640-798 | Three.js 초기화 | Scene, Camera, Renderer, 조명, 별/성운, 지형, 경계벽 |
| 803-1097 | 플레이어/무기 생성 | `createPlayer()`, `createGun()`, `createKatana()` - 메시 조립 |
| 1101-1247 | 기지 시스템 | 적 기지(`createBase`) + 플레이어 기지(`createPlayerBase`) |
| 1251-1372 | 적 생성 | `createEnemy()` - 일반적/보스 적 생성, userData에 상태 저장 |
| 1377-1448 | 유닛 시스템 | `createUnit()` - 보병/탱크/저격수 아군 유닛 |
| 1457-1498 | `initGame()` | 게임 초기화 및 리셋 |
| 1504-1537 | 입력 처리 | 키보드 이벤트 (방향키, Z/X/B/TAB/Space/C) |
| 1542-1684 | 전투 시스템 | 무기 전환, 레이저 발사, 카타나 근접 공격 |
| 1690-1757 | 데미지 시스템 | 적/플레이어 데미지, 적 처치 시 코인/체력 드롭 |
| 1765-1823 | 스테이지 시스템 | 보스 스폰, 클리어, 업그레이드, 다음 스테이지 |
| 1827-1874 | 상점/유닛 관리 | 유닛 구매, 유닛 모드(따르라/공격/방어) |
| 1879-1920 | 픽업/파티클 | 코인, 체력 픽업, 파티클 이펙트 |
| 1924-2000 | HUD/미니맵 | UI 업데이트, 캔버스 미니맵 렌더링 |
| 2006-2395 | 게임 루프 | `gameLoop()` - 이동, 카메라, 적 AI, 유닛 AI, 충돌, 스폰 |

## 핵심 패턴

- **게임 상태**: 모든 상태는 전역 객체 `G`에 집중. 적/총알/유닛은 `G.enemies`, `G.bullets`, `G.units` 배열로 관리.
- **엔티티 데이터**: Three.js 메시의 `userData`에 게임 로직 데이터(hp, speed, damage 등) 저장.
- **카메라**: 쿼터뷰(top-down isometric) 시점. 플레이어 위치를 따라감.
- **조작**: 키보드 전용 (방향키 이동, Z 사격, X 근접, Space 점프, C 달리기, B 상점, TAB 유닛모드).
- **사운드**: 외부 오디오 파일 없이 Web Audio API oscillator/noise로 모든 효과음과 BGM을 절차적 생성.
- **외부 의존성**: CDN Three.js(r128)만 사용. 다른 라이브러리 없음.
