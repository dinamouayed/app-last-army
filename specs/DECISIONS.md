# Development Decisions

## 2026-08-24 — Lane controls

One completed horizontal swipe always moves exactly one lane.

RIGHT -> LEFT requires:
RIGHT -> CENTER -> LEFT

Therefore two separate swipe gestures are required.

This overrides any previous implementation where swipe distance could determine the number of lanes crossed.

---

## 2026-08-24 — Road perspective

The road must represent a flat ground plane.

Pseudo-3D depth comes from:
- convergence
- scaling
- perspective spacing
- object movement

The road itself must never visually curve upward near the player.

---

## 2026-08-28 — Boss unlock by kills

Boss encounters are gated by enemies killed, not by a fixed distance interval.

The first boss is armed after `firstBossKills`. Later bosses require `bossKillInterval` additional kills. After the threshold is met, a short BossApproach segment is inserted, then the boss spawns.

This overrides the original specification that spawned a boss every configurable distance interval.

---

## 2026-08-24 — Player placeholder

The player must always be visually recognizable as a soldier.

A generic circle or abstract player marker is not acceptable, even during prototyping.

---

## 2026-08-24 — Visual direction

Move toward a colorful casual-mobile-game aesthetic.

Avoid dark developer-prototype visuals.