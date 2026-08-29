# Mandatory Context

Before making ANY implementation or architectural decision, read:

1. `specs/GAME_DESIGN.md`
2. `specs/ROADMAP.md`
3. `specs/DECISIONS.md`

`GAME_DESIGN.md` is the complete product specification.

`DECISIONS.md` contains later decisions and overrides the original specification in case of conflict.

`ROADMAP.md` defines what may currently be implemented.

Do not implement future phases unless explicitly requested by the user.

# Visual feedback

Never use a sudden full-screen tint, colored rectangle, or gate-shaped panel as hit / death / explosion feedback. Those look like debug overlays.

Effects must stay local to the object (particles, fireball, shockwave, shake) and ease in and out. Do not fill the screen with a solid or semi-solid color square.
