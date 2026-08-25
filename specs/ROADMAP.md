# Last Army — Development Roadmap

This file tracks the implementation progress of Last Army.

It does **not** replace `GAME_DESIGN.md`.

For complete gameplay specifications, always refer to:

* `specs/GAME_DESIGN.md`
* `specs/DECISIONS.md`

`DECISIONS.md` overrides `GAME_DESIGN.md` when a later decision conflicts with the original specification.

---

# Development Rules

Work on **one phase at a time**.

Do not start the next phase until:

* the current phase is implemented;
* TypeScript checks pass;
* relevant tests pass;
* the app launches correctly;
* the current phase has been manually tested;
* major regressions have been fixed.

Do not implement features from future phases unless explicitly requested.

When a phase is completed and manually validated, update this roadmap.

Status values:

* ⬜ NOT STARTED
* 🟡 IN PROGRESS
* 🟠 IMPLEMENTED — NEEDS MANUAL VALIDATION
* 🟢 VALIDATED
* 🔴 BLOCKED

---

# Current Status

**Current phase:** Phase 6 — Weapons

**Status:** 🟠 IMPLEMENTED — NEEDS MANUAL VALIDATION

Phases 1, 1.5, 2, 3, 4 and 5 are validated. Phase 6 weapon progression (configs, unlock objects, HUD) is implemented and waiting for manual validation.

Do NOT start Phase 7 until Phase 6 has been manually validated.

---

# Phase 1 — Core Runner

**Status:** 🟢 VALIDATED

## Objective

Create the minimum technical foundation for an endless three-lane runner.

## Implemented

* [x] Expo / React Native / TypeScript project
* [x] React Native Skia rendering
* [x] Game screen
* [x] Game loop
* [x] Three logical lanes
* [x] Endless forward movement
* [x] Basic pseudo-3D road
* [x] Horizontal swipe controls
* [x] Smooth lane movement
* [x] Distance counter
* [x] Basic HUD
* [x] Home screen
* [x] Play flow
* [x] Development FPS display

## Known issues discovered during manual testing

These are addressed by Phase 1.5:

* lane switching behavior is incorrect for large swipes;
* road perspective has an unnatural curved/folded effect near the bottom;
* player is represented by an abstract blue ball;
* environment is too empty;
* visual direction looks too much like a technical prototype;
* home screen needs stronger game identity.

---

# Phase 1.5 — Foundation Polish

**Status:** 🟢 VALIDATED

## Objective

Fix the fundamental controls, perspective and visual foundation before introducing gameplay entities.

## Controls

* [x] One swipe moves exactly one lane
* [x] RIGHT → LEFT requires two separate swipes
* [x] LEFT → RIGHT requires two separate swipes
* [x] Swipe distance cannot skip the center lane
* [x] Lane transitions remain smooth
* [x] Prevent accidental multiple lane changes

## Road & Camera

* [x] Remove curved/folded road effect
* [x] Road behaves as a flat ground plane
* [x] Road continues naturally beyond bottom of screen
* [x] Improve vanishing-point perspective
* [x] Improve perspective lane convergence
* [x] Improve road-marker movement
* [x] Centralize world-to-screen projection

## Player

* [x] Replace blue ball with recognizable stylized soldier
* [x] Soldier has visible helmet/body/weapon
* [x] Soldier faces forward
* [x] Add subtle running animation
* [x] Add subtle ground shadow
* [x] Keep soldier renderer reusable for future armies

## Environment

* [x] Replace countryside with stylized military / battlefield setting
* [x] Use desaturated industrial environment colors
* [x] Keep gameplay accents (blue army / future red enemies) distinct from scenery
* [x] Add roadside combat-zone props
* [x] Add distant ruined skyline / smoke / haze
* [x] Environment respects world perspective
* [x] Road reads as stylized asphalt (wear, cracks, patches, tire marks)
* [x] Surrounding terrain uses dusty / khaki variation rather than a flat fill
* [x] Roadside and distant decorations add battlefield density without entering playable lanes

## HUD

* [x] Keep army count
* [x] Keep distance
* [x] Remove debug-looking HOME text
* [x] FPS visible only in development/debug mode
* [x] Improve general HUD readability

## Home Screen

* [x] Improve visual identity
* [x] Show game-world visual elements
* [x] Show battlefield road / soldier / environment
* [x] Keep LAST ARMY title
* [x] Keep best-distance display
* [x] Improve PLAY button
* [x] Remove permanent swipe instruction
* [x] Remove unnecessary subtitle

## Validation

Before Phase 2:

* [x] Test LEFT → CENTER
* [x] Test CENTER → RIGHT
* [x] Test RIGHT → CENTER
* [x] Test CENTER → LEFT
* [x] Verify large swipes never skip a lane
* [x] Verify road no longer visually curves
* [x] Verify soldier is immediately recognizable
* [x] Verify perspective feels coherent
* [x] Verify environment reads as a battlefield, not a countryside
* [x] Verify game maintains smooth performance
* [x] Run TypeScript checks
* [x] Run tests
* [x] Manual validation on iOS simulator/device

---

# Phase 2 — Shooting & First Enemy

**Status:** 🟢 VALIDATED

## Objective

Introduce the first actual combat loop.

## Shooting

* [x] Automatic continuous shooting
* [x] Projectile system
* [x] Projectile movement
* [x] Weapon fire rate
* [x] Weapon damage
* [x] Muzzle feedback

## Enemy

* [x] Basic enemy type
* [x] Enemy spawning
* [x] Enemy movement toward army
* [x] Enemy HP
* [x] Projectile → enemy collisions
* [x] Enemy damage
* [x] Enemy death
* [x] Basic hit/death feedback

## Validation

The player must be able to:

1. run;
2. change lanes;
3. automatically shoot;
4. encounter an enemy;
5. damage it;
6. kill it;
7. continue running.

Manual validation completed before Phase 3.

---

# Phase 3 — Army System

**Status:** 🟢 VALIDATED

## Objective

Transform the single soldier into a scalable army.

* [x] Logical `armySize`
* [x] Start with 1 soldier
* [x] Dynamic visual crowd
* [x] Formation generation
* [x] Formation changes with army size
* [x] Separate logical and visible soldier counts
* [x] Maximum visible soldier cap
* [x] Efficient rendering of many soldiers
* [x] Army damage
* [x] Soldier removal/death visualization
* [x] Game over when `armySize <= 0`

## Performance requirement

A logical army containing hundreds or thousands of soldiers must NOT require rendering the same number of individual soldiers.

## Phase 3 corrective pass (pre-Phase 4)

* [x] Wedge formation (front narrow, rear deep)
* [x] Physical enemy/army footprint collisions
* [x] Contact combat with repeated attacks
* [x] Continuous enemy X positioning
* [x] Grouped Basic Enemy spawning
* [x] Corrected encounter pacing / approach speed
* [x] Lane-concentrated firing corridor (no road-wide volleys)
* [x] Road-bounded enemy spawning
* [x] Enemy approaching / engaging / attacking state machine
* [x] No pass-through at army contact boundary

---

# Phase 4 — Math Gates

**Status:** 🟢 VALIDATED

## Objective

Introduce the primary army-growth decision mechanic.

* [x] `+N` gates
* [x] `-N` gates
* [x] `×N` gates
* [x] Gate rendering
* [x] Gate values
* [x] Gate collision
* [x] Apply arithmetic operation to army
* [x] Positive/negative visual distinction
* [x] Procedural gate choices
* [x] Prevent obviously impossible gate combinations
* [x] Gate activation feedback

---

# Phase 5 — Shootable / Evolving Gates

**Status:** 🟢 VALIDATED

## Objective

Allow the player to invest firepower into improving gates.

* [x] Shootable gates
* [x] Gate HP/progress system
* [x] Projectile → gate collision
* [x] Gate value evolution

Example:

`-10 → -9 → ... → 0 → +1 → ... → +25`

* [x] Configurable improvement threshold
* [x] Configurable maximum value
* [x] Negative → zero feedback
* [x] Zero → positive feedback
* [x] Visual number animation
* [x] Target-priority interaction with enemies

---

# Phase 6 — Weapons

**Status:** 🟠 IMPLEMENTED — NEEDS MANUAL VALIDATION

## Objective

Introduce meaningful weapon progression during a run.

## Weapons

* [x] Pistol
* [x] SMG
* [x] Shotgun
* [x] Machine Gun

## Weapon System

* [x] Centralized weapon configuration
* [x] Damage
* [x] Fire rate
* [x] Projectile speed
* [x] Projectile count
* [x] Spread
* [x] Weapon-specific firing behavior

## Weapon Unlock Objects

Weapon unlocks appear as **wooden barrel gates** in lane choice sets (alongside +/−/× gates).

* [x] Shootable weapon barrel gates (lane choice)
* [x] HP number displayed on barrel — decreases when shot
* [x] Unlock weapon when HP reaches 0 (explosion + equip)
* [x] Lethal if army crosses barrel before HP reaches 0
* [x] Player can switch lanes to pick a math gate instead
* [x] Increasing unlock costs (scale with distance)
* [x] Equip unlocked weapon
* [x] Barrel explosion animation
* [x] Unlock feedback banner

---

# Phase 7 — Boss System

**Status:** ⬜ NOT STARTED

## Objective

Create periodic high-pressure survival encounters without ending the run after victory.

* [ ] Boss spawning based on distance
* [ ] Boss HP
* [ ] Boss health bar
* [ ] Boss movement toward army
* [ ] Boss receives projectile damage
* [ ] Boss reaches army
* [ ] Repeated boss attacks
* [ ] Configurable attack interval
* [ ] Boss removes groups of soldiers
* [ ] Army continues firing during boss attacks
* [ ] Boss death
* [ ] Boss death effects
* [ ] Run continues after boss victory
* [ ] Game over if boss destroys entire army

## Desired tension

A boss encounter should allow situations where the player survives with only a few soldiers remaining.

---

# Phase 8 — Procedural World & Difficulty

**Status:** ⬜ NOT STARTED

## Objective

Turn the existing mechanics into a genuinely endless game.

## Procedural Segments

* [ ] GateChoice
* [ ] EnemyWave
* [ ] ShootableGate
* [ ] WeaponUnlock
* [ ] MixedEncounter
* [ ] RecoverySection
* [ ] BossApproach

## Generation

* [ ] Weighted segment selection
* [ ] Continuous world generation
* [ ] Segment recycling
* [ ] Game-state-aware generation where appropriate
* [ ] Fairness constraints
* [ ] Avoid unavoidable procedural deaths
* [ ] Seed architecture for reproducible runs/debugging

## Difficulty

Scale with distance:

* [ ] Enemy HP
* [ ] Enemy count
* [ ] Enemy speed
* [ ] Spawn frequency
* [ ] Boss HP
* [ ] Boss damage
* [ ] Weapon unlock costs
* [ ] Gate values
* [ ] Encounter complexity

Difficulty curves must remain centralized and configurable.

---

# Phase 9 — Game Feel & Polish

**Status:** ⬜ NOT STARTED

## Objective

Make existing gameplay satisfying rather than adding major new mechanics.

## Shooting

* [ ] Muzzle flashes
* [ ] Projectile trails
* [ ] Recoil
* [ ] Shooting effects

## Combat

* [ ] Enemy hit flashes
* [ ] Hit particles
* [ ] Enemy death effects
* [ ] Floating feedback where useful

## Gates

* [ ] Gate activation animation
* [ ] Number transitions
* [ ] Positive gate effects

## Boss

* [ ] Screen shake
* [ ] Strong impact feedback
* [ ] Boss attack effects
* [ ] Boss death explosion
* [ ] Dramatic boss death feedback

## Haptics

* [ ] Gate haptics
* [ ] Combat haptics
* [ ] Boss attack haptics
* [ ] Boss death haptics

## Performance

* [ ] Particle limits
* [ ] Projectile optimization
* [ ] Object pooling where useful
* [ ] Maintain target FPS under heavy gameplay

---

# Phase 10 — MVP Completion

**Status:** ⬜ NOT STARTED

## Objective

Turn the gameplay prototype into a complete replayable application.

## Persistence

* [ ] Save best distance
* [ ] Load best distance
* [ ] Handle new records

## Game Over

* [ ] Game over screen
* [ ] Current distance
* [ ] Best distance
* [ ] NEW BEST feedback
* [ ] One-tap restart

## Home

* [ ] Final MVP home-screen polish
* [ ] Best score
* [ ] Play button
* [ ] Appropriate game-world presentation

## UX

* [ ] Fast launch
* [ ] Fast restart
* [ ] No unnecessary menus
* [ ] First-run swipe guidance if needed

---

# Post-MVP — Only After Core Game Validation

These features must NOT be implemented until the core game is fun and stable.

## Meta Progression

* [ ] Soldier skins
* [ ] Weapon skins
* [ ] Environments
* [ ] Coins
* [ ] Unlockables
* [ ] Achievements
* [ ] Trophies
* [ ] Statistics
* [ ] Daily missions
* [ ] Daily challenges

## Social / Competition

* [ ] Game Center
* [ ] Leaderboards
* [ ] Achievements

## Monetization

Potential future systems:

* [ ] Rewarded revive
* [ ] Optional rewarded bonuses
* [ ] Limited revives per run
* [ ] Ads strategy
* [ ] In-app purchases if appropriate

Monetization must NOT damage the core gameplay experience.

---

# MVP Definition of Done

The first complete MVP is reached when the player can:

* [ ] Launch Last Army
* [ ] Tap PLAY
* [ ] Start with one soldier
* [ ] Move between exactly three lanes
* [ ] Automatically shoot
* [ ] Kill enemies
* [ ] Grow and lose soldiers
* [ ] Choose mathematical gates
* [ ] Improve shootable gates
* [x] Unlock stronger weapons
* [ ] Encounter increasingly difficult enemies
* [ ] Fight bosses
* [ ] Survive bosses and continue the same run
* [ ] Experience continuously increasing difficulty
* [ ] Play without finite/manual levels
* [ ] Eventually lose the entire army
* [ ] See final distance
* [ ] Save a best distance
* [ ] Restart immediately

The intended core loop remains:

**RUN → GROW → CHOOSE → SHOOT → SURVIVE → BOSS → CONTINUE → DIE → BEAT HIGH SCORE → RESTART**

---

# Current Next Action

Manually validate:

**Phase 6 — Weapons**

Then, and only then:

**Phase 7 — Boss System**
