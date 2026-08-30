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

## 2026-08-29 — Anti-AFK: percent contact, divide gates

A large army must not be a valid "stand still" strategy.

- Basic-enemy contact damage uses a percentage of current army size (with a 1-soldier floor), matching the boss slam idea at a smaller fraction (2%).
- Math gates may offer `÷N` (initially `÷2`) once the army is large enough to survive a half. Grow-vs-shrink choices are valid, not "obviously unfair".
- Enemies stay in their spawn lane and in front of the army. They must not wrap behind the formation. Projectiles only hit the selected lane — including enemies already piled at the front. Clearing a melee stack requires a swipe onto that lane.

This overrides the flat 1-soldier contact tick.

---

## 2026-08-29 — Lane hazards and chargers

Standing still must become unsafe even with a large army.

- Unshootable TNT crates occupy 1 or 2 lanes (never 3). Hitting a crate wipes the army. They appear after the opening stretch.
- Hitting a crate plays a short local explosion (fireball, shockwave) before the game-over screen. No full-screen tint and no red panel flash.
- Fast charger enemies appear from 1000 m. They stay in their spawn lane, rush the army, and deal heavier contact damage. They must be faced by switching into their lane. Missed chargers in another lane despawn instead of wrapping behind the formation.

---

## 2026-08-29 — Denser visible army

Player soldiers are drawn smaller, so the visible crowd cap is 220 and formation spacing is tighter. A huge army stretches off the bottom of the screen so the visible crowd is clearly not the whole army. Logical army size is unchanged; this is a representation change only.

---

## 2026-08-29 — Shootable gates have no value cap

Shooting a math gate keeps raising its signed value with no maximum. The original +25 ceiling is removed: extra shots after +25 still count.

---

## 2026-08-29 — Opening red enemies

Early red enemies are larger and take more shots to drop so the first stretch is not empty. Their near-camera draw scale is compressed so a melee pile does not balloon to twice the size of the blue army.

---

## 2026-08-29 — Enemy count vs distance

Enemy group size and wave density scale with meters traveled, from a small opening up to a late-game cap. They do not scale with army size: skipping growth does not shrink the pressure that distance already earned.

The density curve reaches its cap later than HP and speed (2000 m). Mid-run (around 1000–1500 m) stays below the late-game group and wave ceilings so the road is busy without flooding every lane.

---

## 2026-08-24 — Player placeholder

The player must always be visually recognizable as a soldier.

A generic circle or abstract player marker is not acceptable, even during prototyping.

---

## 2026-08-24 — Visual direction

Move toward a colorful casual-mobile-game aesthetic.

Avoid dark developer-prototype visuals.

Never use a sudden full-screen tint, colored rectangle, or gate-shaped panel as hit / death / explosion feedback. Those read as debug overlays. Effects stay local to the object (particles, fireball, shockwave, shake) and ease in and out.

---

## 2026-08-29 — Boss tap-fireball

During an active boss fight, rapid taps charge a growing circle. When the circle fills, it launches a fireball that deals a large chunk of the boss's max HP on impact.

- Swipes still change lanes and never count as taps.
- Filling the circle takes a sustained mash (about 24 taps). Each follow-up tap must arrive within `tapMaxGap` or it does not add charge. Idle grace stays slightly above that gap so a valid mash does not leak. Charge still decays quickly if the player pauses.
- The player can launch several fireballs in one encounter.
- The fireball deals 25% of the boss's initial max HP and cannot finish the boss (leaves at least 1 HP). It is a boost, not an execute.
- The fireball, charge circle, and impact stay local to the army/boss. No full-screen tint.

---

## 2026-08-30 — Boss HP after tap-fireball

Boss max HP is `baseMaxHp + distance * hpPerDistance`. It does not scale with army size.

Raised `baseMaxHp` 850 → 1200 and `hpPerDistance` 2.8 → 3.8 so the tap-fireball remains a 25% boost instead of making the fight trivial.

Slam cadence is tighter: idle `attackInterval` 3.2 → 1.7 (first boss 5.0 → 2.6), `holdBeforeAttack` 1.5 → 0.7, `recoverHoldDuration` 1.0 → 0.4. Wind-up and slam animation timings stay readable.

---

## 2026-08-30 — Boss slam uses opening army, not leftover army

Each slam used to take a fraction of the *current* army. That felt right on the first hit (200k → 150k) and absurd later in the same fight (50 → 25) after a 500k opening.

Slam damage is now locked when the boss spawns:

```
chunk = openingArmy * (encounterFraction + distanceEase)
floor = base + encounterBonus + distanceBonus
slam  = max(chunk, floor)
```

Every slam in that fight uses the same number (clamped to soldiers left). A huge opening still loses a huge chunk. A leftover of 50 still eats that same chunk, so the boss does not lose credibility. Distance raises both the fraction and the floor, so an undergrown army at 10 km is in more danger than one at 300 m. Growing still helps: the floor is what punishes a small army, not a tax on success.