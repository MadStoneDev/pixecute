# Pixecute Implementation Plan

> **Version**: 0.5.1 → 1.0.0
> **Created**: 2026-03-17
> **Goal**: Complete pixel art editor with animation groups, cloud save, full export pipeline, and polished tablet/desktop UX.

---

## Phase 1: Export Pipeline (No Backend Required)

These are all client-side features that unblock the most user value immediately.

### 1.1 Export Modal UI
- [x] Create `ExportModal.tsx` component accessible from editor toolbar
- [x] Options: format (PNG/JPG/GIF/Sprite Sheet), frame selection, scale (1x–8x), quality (JPG)
- [x] Wire up the existing "Export" button in `SideToolbar.tsx` (currently a no-op)

### 1.2 JPG Export
- [x] Add JPG export to `ArtworkManager.ts` using `canvas.toBlob("image/jpeg", quality)`
- [x] Support quality slider (0.1–1.0)
- [x] Add background color option (JPG has no transparency)

### 1.3 GIF Export (Animated)
- [x] Install `gifenc` for client-side GIF encoding
- [x] Create `utils/GifExporter.ts` — iterate frames, composite layers per frame, encode
- [x] Support: all frames, frame range, per-group export (Phase 3)
- [x] Progress indicator during encoding

### 1.4 Sprite Sheet Export
- [x] Create `utils/SpriteSheetExporter.ts`
- [x] Layout options: grid (auto-calculate columns) with configurable column count
- [x] Export as PNG with metadata JSON (frame positions, sizes, durations)
- [x] Support scale multiplier
- [x] Support exporting specific animation groups (Phase 3)

### 1.5 Fix PNG Export
- [x] Allow user to choose which frame to export (not hardcoded frame 0)
- [x] Allow user to choose scale (not hardcoded 4x)
- [x] Make export accessible from editor (not just ArtworkBrowser)

---

## Phase 2: Cloud Save (Supabase)

Self-hosted Supabase on Coolify.

### 2.1 Supabase Client Setup
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Create `.env.local` with your actual Supabase URL and anon key
- [x] Create `.env.example` for documentation
- [x] Create `utils/supabase/client.ts` (browser client)
- [x] Create `utils/supabase/server.ts` (server client)
- [x] Add middleware for auth session refresh (`src/middleware.ts`)

### 2.2 Authentication
- [x] Auth modal component (`AuthModal.tsx`) — sign in / sign up
- [x] Support email/password auth
- [ ] Optional: OAuth providers (GitHub, Google)
- [x] User menu component (`UserMenu.tsx`) integrated in NavBar
- [x] Editor works without auth (local-only), cloud features prompt login

### 2.3 Database Schema (Supabase/Postgres)
- [x] `profiles` table with auto-creation trigger
- [x] `artworks` table with full metadata
- [x] Row Level Security (RLS) policies
- [x] SQL migration file (`supabase/migrations/001_initial_schema.sql`)

### 2.4 Cloud Storage (Supabase Storage)
- [x] Storage bucket policies defined in migration (commented, ready to enable)
- [x] Upload/download functions in `utils/CloudStorage.ts`
- [x] Thumbnail upload support

### 2.5 Sync Logic
- [x] Create `utils/CloudSync.ts`
- [x] Save to cloud: serialize → upload to Storage → save metadata to DB
- [x] Load from cloud: download from Storage → deserialize → save to IndexedDB
- [x] Cloud save button in toolbar with auth flow
- [x] Save indicator: blue for cloud, green for local
- [x] Offline-first: always saves to IndexedDB first
- [x] Cloud gallery page on home screen (browse/open/delete cloud artworks)
- [ ] Conflict resolution: last-write-wins with timestamp comparison

---

## Phase 3: Animation Groups

### 3.1 Data Model Changes
- [x] Add `AnimationGroup` type to `types/canvas.ts`
- [x] Add `groups: AnimationGroup[]` to `Artwork` interface
- [x] Serialization handles groups automatically (spread operator)
- [x] History deep-clones groups properly
- [x] IndexedDB schema — not needed, groups serialize with artwork automatically

### 3.2 Animation Group UI
- [x] Create `AnimationGroupPanel.tsx` — list of groups with add/edit/delete
- [x] Group name editing (with preset suggestions: idle, walk, run, jump, attack, die, hurt)
- [x] Assign frames to groups via toggle buttons
- [x] Visual indicators on timeline showing which group a frame belongs to
- [x] Color-coded group labels on frame headers

### 3.3 Group Playback
- [x] Modify `AnimationControl.tsx` to support playing a single group
- [x] Group panel integrated into animation controls
- [x] Active group indicator with clear button
- [x] Per-group loop/ping-pong settings

### 3.4 Group Export
- [x] Export single group as GIF (via ExportModal group selector)
- [x] Export single group as sprite sheet (via ExportModal group selector)
- [x] Export all groups as separate files (batch) — "Each Group (Batch)" option in ExportModal
- [x] Export all groups as single sprite sheet with JSON metadata (groups as rows)

---

## Phase 4: Tablet & Input Polish

### 4.1 Pinch-to-Zoom
- [x] Detect pinch gesture in `LiveDrawingArea.tsx` (2-pointer distance tracking)
- [x] Map pinch distance delta to zoom level
- [x] Zoom centered on midpoint between fingers

### 4.2 Pressure Sensitivity
- [x] Read `event.pressure` from PointerEvent (0.0–1.0)
- [x] Map pressure to brush opacity (pencil tool)
- [x] Map pressure to brush size
- [x] `pressureMode` setting: "none", "opacity", "size", "both"
- [x] Pressure mode toggle in toolbar (cycles none/opacity/size/both)

### 4.3 Brush Size
- [x] Add `brushSize` to Zustand store (1–16px for pixel art)
- [x] Keyboard shortcut `[` / `]` for brush size
- [x] Square brush stamp for pencil/eraser (iterate NxN grid)
- [x] Brush size slider in toolbar UI (increment/decrement buttons + display)
- [x] Preview brush size on cursor (outline square)
- [x] Pressure mode toggle in toolbar (cycles: off → opacity → size → both)

### 4.4 Touch UX Improvements
- [x] Prevent accidental drawing when scrolling panels (stopPropagation on LayerControl)
- [x] Palm rejection heuristic (ignore touch contact area >= 40px)
- [x] Two-finger tap for undo
- [x] Three-finger tap for redo

---

## Phase 5: Quality of Life

### 5.1 Transform Tools
- [x] Flip horizontal / vertical (per-layer, current frame)
- [x] Rotate 90° CW / CCW (per-layer, current frame)
- [x] Transform buttons in Layer Settings modal
- [x] Canvas resize with 9-point anchor grid, ratio lock, presets (via Settings button)

### 5.2 Artwork Naming
- [x] Allow user to name artwork on creation
- [x] Store `name` in `Artwork` interface
- [x] Show editable name in editor (top-left)
- [x] Export filenames use artwork name

### 5.3 Timeline Enhancements
- [x] Drag-to-reorder frames
- [x] Color-coded group indicators on frame headers
- [x] Frame thumbnails in timeline (mini canvas previews)
- [x] Playhead/frame counter indicator in animation controls
- [x] Multi-frame selection (Shift+click range, Ctrl+click toggle) with bulk delete/duplicate/timing

### 5.4 Improved IndexedDB Storage
- [x] Remove 5-artwork limit
- [x] Pagination in ArtworkBrowser (Show More, 12 per page)
- [x] Sort/filter artworks (by name, date, size) + text search

---

## Dependency Additions

```bash
# Phase 1 - Export
npm install gifenc              # Lightweight GIF encoder (~4KB)

# Phase 2 - Cloud
npm install @supabase/supabase-js @supabase/ssr

# Phase 4 - (no new deps, uses native PointerEvent API)
```

---

## Implementation Order

| Order | Phase | Feature | Priority |
|-------|-------|---------|----------|
| 1 | 1.2 | JPG Export | Quick win |
| 2 | 1.5 | Fix PNG Export (frame/scale selection) | Quick win |
| 3 | 1.1 | Export Modal UI | Enables all exports |
| 4 | 1.3 | GIF Export | High value |
| 5 | 1.4 | Sprite Sheet Export | High value |
| 6 | 3.1 | Animation Group data model | Foundation |
| 7 | 3.2 | Animation Group UI | User-facing |
| 8 | 3.3 | Group Playback | Usability |
| 9 | 3.4 | Group Export | Completes animation story |
| 10 | 2.1 | Supabase Client Setup | Foundation |
| 11 | 2.2 | Authentication | Required for cloud |
| 12 | 2.3 | Database Schema | Required for cloud |
| 13 | 2.4 | Cloud Storage | Required for cloud |
| 14 | 2.5 | Sync Logic | Completes cloud story |
| 15 | 4.1 | Pinch-to-Zoom | Tablet UX |
| 16 | 4.2 | Pressure Sensitivity | Tablet UX |
| 17 | 4.3 | Brush Size | Drawing UX |
| 18 | 4.4 | Touch UX Improvements | Tablet UX |
| 19 | 5.1 | Transform Tools | Nice to have |
| 20 | 5.2 | Artwork Naming | Nice to have |
| 21 | 5.3 | Timeline Enhancements | Nice to have |
| 22 | 5.4 | Improved IndexedDB Storage | Nice to have |

---

## Status Key

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked
