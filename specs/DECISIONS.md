# Last Army — Design Decisions

This file is the project source of truth for decisions made after the original design document.

When a later decision conflicts with `GAME_DESIGN.md`, this file wins.

Do not delete previous entries. Append new decisions at the bottom.

---

## 2026-08-24 — Stylized military / battlefield art direction

Last Army's environment must follow a **stylized military / battlefield / survival** aesthetic.

The player should immediately read:

> I am leading soldiers through a dangerous combat zone.

Explicitly avoid the previous **bright cheerful countryside** look:

* bright green grass
* cartoon blue sky
* white clouds
* a cute yellow sun
* clean beige road
* playful "children's runner" coloring

### Environment

Use a stylized combat setting such as a damaged highway, military supply route, or industrial outskirts.

The world should stay **readable and colorful**, not grim, black, or horror-like.

Think: cloudy afternoon during a conflict.

### Color language

Environment: desaturated concrete grey, steel blue, khaki, brown, navy, off-white.

Gameplay accents (keep reserved, do not flood the scenery with them):

* BLUE = player army
* RED = enemies / danger
* GREEN or CYAN = positive bonuses
* ORANGE = explosions / warning
* YELLOW = rewards / weapons

### Constraints

* Keep the current pseudo-3D camera and three-lane road.
* No gore.
* Decorative props must not look like future gates, bonuses, or enemies.
* Home screen uses the same battlefield art direction.

---

## 2026-08-24 — Stylized asphalt materials and battlefield density

The battlefield environment must use visible stylized material cues. In particular, the road must visually read as asphalt/tarmac rather than a uniform grey polygon. Environmental surfaces should use subtle procedural variation, wear, damage and debris while preserving gameplay readability.
