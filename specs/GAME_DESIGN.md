# ROLE

You are a senior mobile game developer specialized in React Native, Expo, TypeScript, 2D game architecture, procedural generation, mobile performance, and game feel.

I want you to build a complete playable mobile game prototype for iOS first, while keeping Android compatibility.

The game is an **endless 3-lane army shooter/runner**, inspired by the simplicity and replayability of endless runners and by crowd/math-gate shooter mechanics.

The game must NOT use manually designed levels.

The world must be generated procedurally and continue indefinitely until the player loses their entire army.

The most important priorities are:

1. Fun gameplay
2. Extremely responsive controls
3. Satisfying shooting and destruction
4. Smooth performance
5. Clean architecture
6. Easy balancing
7. Easy future expansion
8. No manually created levels

Do NOT over-engineer the first version.

Build a polished MVP around the core gameplay loop first.

---

# 1. TECH STACK

Use:

* React Native
* Expo
* TypeScript
* React Native Skia for the game rendering
* React Native Reanimated when useful for UI animations
* Expo Haptics for feedback
* AsyncStorage for local persistence

Avoid unnecessary dependencies.

Do NOT use hundreds of React components for game entities.

Do NOT update React state every frame.

React should mainly handle:

* screens
* menus
* HUD
* game over screen
* settings
* future shop/meta-game UI

The actual game simulation must live outside React state.

Use a performant game loop and mutable game state.

---

# 2. ARCHITECTURE

Do NOT create a heavy inheritance-based OOP architecture.

Avoid patterns such as:

Entity -> LivingEntity -> Character -> Soldier

Prefer a data-oriented architecture with TypeScript types/interfaces and independent systems.

For example:

```ts
interface Soldier {
  id: number;
  x: number;
  y: number;
  visualOffsetX: number;
  visualOffsetY: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: EnemyType;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  damage: number;
  speed: number;
}

interface Army {
  size: number;
  lane: number;
  weapon: WeaponType;
}
```

Separate simulation from rendering.

Suggested architecture:

```text
src/
  game/
    engine/
      GameLoop.ts
      GameState.ts
      CollisionSystem.ts
      SpawnSystem.ts
      DifficultySystem.ts
      WorldGenerator.ts

    entities/
      Soldier.ts
      Enemy.ts
      Projectile.ts
      Gate.ts
      Weapon.ts
      Boss.ts

    systems/
      ArmySystem.ts
      ShootingSystem.ts
      EnemySystem.ts
      ProjectileSystem.ts
      GateSystem.ts
      BossSystem.ts
      SpawnSystem.ts
      DifficultySystem.ts

    config/
      weapons.ts
      enemies.ts
      bosses.ts
      difficulty.ts
      game.ts

  rendering/
    GameCanvas.tsx
    WorldRenderer.tsx
    ArmyRenderer.tsx
    EnemyRenderer.tsx
    ProjectileRenderer.tsx
    GateRenderer.tsx
    EffectsRenderer.tsx

  screens/
    HomeScreen.tsx
    GameScreen.tsx
    GameOverScreen.tsx

  components/
    HUD.tsx
    ScoreDisplay.tsx
    ArmyCounter.tsx
    WeaponIndicator.tsx
```

You may adapt this structure if a cleaner architecture is appropriate.

---

# 3. CORE GAME CONCEPT

The game is an endless runner.

The player controls an army moving continuously forward.

The world consists of **3 lanes**:

LEFT
CENTER
RIGHT

The camera follows the army automatically.

The player does NOT control forward movement.

The player only controls lateral movement.

The army automatically shoots forward continuously.

The game continues until:

```text
armySize <= 0
```

There are NO traditional levels.

The player's objective is simply:

> Travel as far as possible.

The primary score is distance.

Example:

```text
DISTANCE
2,847 m
```

Store the player's best distance locally.

---

# 4. PLAYER CONTROLS

The player should be able to move between the three lanes.

Initially implement intuitive horizontal swipe/drag controls.

Dragging left moves the army toward the left lane.

Dragging right moves toward the right lane.

Movement should feel smooth rather than instantly teleporting between lanes.

The army should interpolate toward the target lane.

The controls must remain responsive even while many objects are visible.

---

# 5. ARMY

The player starts with:

```text
armySize = 1
```

The army automatically shoots forward.

The logical number of soldiers and the visual number of soldiers must be separated.

For example:

```text
armySize = 847
```

does NOT mean that 847 individual React components or full entities need to exist.

Create a visual representation system.

For small armies:

1 logical soldier ≈ 1 visible soldier.

For large armies, cap the number of rendered soldiers.

Example:

```text
MAX_VISIBLE_SOLDIERS = 80
```

If the army contains 800 soldiers, approximately 80 soldiers can visually represent the crowd.

The formation should dynamically expand as the army grows.

Small army:

```text
   O
```

Medium:

```text
   O O
  O O O
   O O
```

Large:

```text
 O O O O O
O O O O O O
 O O O O O
```

Add small positional variations so the army feels organic rather than perfectly aligned.

---

# 6. AUTOMATIC SHOOTING

The army continuously fires forward.

The player does NOT press a shooting button.

The firing system depends on:

* army size
* current weapon
* weapon fire rate
* weapon damage

Do NOT necessarily create one projectile per soldier for huge armies.

Aggregate or optimize projectile generation when necessary.

The visual result should still give the impression that the whole army is firing.

---

# 7. WEAPONS

Create an extensible weapon configuration system.

Initial weapons:

### Pistol

Starting weapon.

Moderate damage.

Moderate fire rate.

### SMG

Low damage per shot.

High fire rate.

### Shotgun

Multiple projectiles / spread.

High close-range damage.

### Machine Gun

High fire rate.

Good damage.

Weapon stats MUST live in configuration files and not be hardcoded throughout the game.

Example structure:

```ts
interface WeaponConfig {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileCount: number;
  spread: number;
}
```

---

# 8. WEAPON UNLOCK OBJECTS

Weapons can be unlocked during a run.

A weapon unlock object appears ahead.

Example:

```text
MACHINE GUN

300
```

The number represents the object's remaining HP/progress.

The army must shoot it.

Each successful hit reduces the number.

Example:

```text
300
299
298
...
1
0
```

When it reaches zero:

* play a satisfying destruction/unlock animation
* trigger haptic feedback
* equip the new weapon
* show a temporary message

Example:

```text
MACHINE GUN UNLOCKED!
```

Later in the run, stronger weapons require much more shooting.

Example:

```text
300
1200
5000
15000
```

depending on difficulty.

---

# 9. MATH GATES

One of the central mechanics is mathematical gates.

The player must choose which lane to enter.

Examples:

```text
+10
```

```text
+30
```

```text
-8
```

```text
×2
```

```text
÷2
```

When the army passes through a gate, apply the operation to armySize.

Examples:

```text
20 soldiers + 15 = 35
```

```text
20 soldiers - 8 = 12
```

```text
20 soldiers × 2 = 40
```

```text
20 soldiers ÷ 2 = 10
```

armySize can never become negative.

If a gate reduces armySize to zero:

GAME OVER.

Positive gates should look visually attractive.

Negative gates should clearly communicate danger.

---

# 10. SHOOTABLE / EVOLVING GATES

This is a major gameplay mechanic.

Some gates can be improved by shooting them before reaching them.

Example:

The gate initially displays:

```text
-10
```

Every X damage received improves its value.

For example:

```text
-10
-9
-8
...
0
+1
+2
...
+25
```

Therefore the player has to make a strategic choice:

* shoot enemies
* shoot the gate
* shoot a weapon unlock object

The player cannot always maximize everything.

Create this mechanic so its balancing parameters are configurable.

Example:

```ts
interface ShootableGateConfig {
  initialValue: number;
  valuePerDamageThreshold: number;
  maxValue: number;
}
```

Give strong visual feedback when the gate crosses important thresholds:

negative -> zero

zero -> positive

+9 -> +10

etc.

---

# 11. ENEMIES

Enemies appear ahead and move toward the player's army.

The army automatically shoots them.

Initial enemy types:

### Basic Enemy

Low HP.

Normal speed.

### Fast Enemy

Low HP.

High speed.

### Tank Enemy

High HP.

Slow speed.

Enemies reaching the army kill soldiers.

Enemies stay in front of the army and steer toward it rather than wrapping behind the formation. Contact damage scales with current army size so a huge crowd cannot tank indefinitely, but a single missed enemy should not wipe the run.

Enemy stats must scale with distance.

---

# 12. ENEMY WAVES

Enemies can appear as groups.

Examples:

small group:

```text
 E E E
```

larger formation:

```text
 E E E E
E E E E E
 E E E E
```

Create multiple procedural formations.

Do NOT manually create levels.

Instead create reusable encounter patterns.

The procedural generator selects and modifies these patterns.

---

# 13. BOSSES

Bosses appear periodically.

For the MVP, spawn a boss approximately every configurable distance interval.

Example:

```text
BOSS
5,000 HP
```

Bosses have:

* much higher HP
* visible health bar
* larger visual size
* slower movement
* high damage

The boss approaches the player's army while being shot.

When the boss reaches the army, it does NOT immediately end the game.

Instead, the boss kills soldiers in repeated attacks.

Example:

```text
armySize = 120
bossDamage = 15
```

Boss reaches army.

Attack:

```text
120 -> 105
```

Wait approximately one second.

Meanwhile, soldiers continue shooting.

Next attack:

```text
105 -> 90
```

Continue until either:

```text
boss.hp <= 0
```

or:

```text
armySize <= 0
```

This creates dramatic situations where the player may kill the boss just before losing the last soldiers.

Boss attacks should produce:

* screen shake
* impact effect
* strong haptic feedback
* soldier disappearance animation

Boss death should feel extremely satisfying.

---

# 14. ENDLESS DIFFICULTY

Difficulty must scale continuously with distance.

Create a centralized DifficultySystem.

It should control things such as:

```text
enemy HP
enemy count
enemy speed
boss HP
boss damage
gate values
weapon unlock cost
spawn frequency
enemy formations
```

Use smooth mathematical progression rather than arbitrary level values.

For example conceptually:

```ts
difficulty = 1 + distance / SOME_CONSTANT;
```

but create appropriate curves for each parameter.

Do NOT allow difficulty to become impossible too quickly.

The goal should be:

early game:
easy and satisfying

mid game:
requires decisions

late game:
chaotic and difficult

very late game:
extremely challenging but theoretically survivable with good decisions

Keep all balancing constants centralized so they can easily be modified.

---

# 15. PROCEDURAL WORLD GENERATION

The world should consist of reusable procedural segments.

Example segment categories:

```text
GateChoice
EnemyWave
ShootableGate
WeaponUnlock
MixedEncounter
RecoverySection
BossApproach
```

The generator continuously creates upcoming segments.

Avoid impossible situations.

For example, do not generate unavoidable negative gates across all three lanes that necessarily kill the player.

The generator should consider the current game state when useful.

Create weighted probabilities for segment types.

Example:

```ts
GateChoice: 30%
EnemyWave: 30%
ShootableGate: 15%
WeaponUnlock: 10%
MixedEncounter: 15%
```

These values must be configurable.

---

# 16. RISK / REWARD

Avoid obvious choices whenever possible.

Bad example:

```text
LEFT: +5
CENTER: +20
RIGHT: +50
```

The right lane is objectively superior.

Prefer situations such as:

```text
LEFT:
+40 soldiers
then large enemy wave

CENTER:
weapon unlock
but requires sustained fire

RIGHT:
×2 fire rate temporary bonus
but no soldiers
```

The player should regularly make quick decisions.

---

# 17. TEMPORARY POWER-UPS

Design the architecture to support temporary bonuses.

For MVP, implement only if core gameplay is already stable.

Possible bonuses:

```text
×2 FIRE RATE
×2 DAMAGE
SHIELD
RAPID FIRE
```

Bonuses should last for a configurable duration.

---

# 18. VISUAL STYLE

The game should initially be **2D / pseudo-3D**, NOT full 3D.

Use a perspective similar to a mobile runner.

The road becomes narrower toward the horizon.

Conceptually:

```text
        | | |
        | | |
       / | \
      /  |  \
     /   |   \
    /    |    \
```

Objects farther away should:

* appear smaller
* move slower visually
* converge toward the horizon

Objects approaching the player should:

* become larger
* move faster visually
* separate horizontally according to lane perspective

Create reusable world-to-screen projection functions.

Do NOT scatter perspective calculations throughout rendering code.

Something conceptually similar to:

```ts
worldToScreen(worldX, worldY)
```

should return:

```ts
{
  screenX,
  screenY,
  scale
}
```

This system should make it possible to later change the camera easily.

---

# 19. PLACEHOLDER GRAPHICS

For the first implementation, DO NOT waste time creating final assets.

Use clean placeholder graphics.

Soldiers:
simple blue circles / stylized shapes

Enemies:
simple red shapes

Boss:
large red shape

Positive gates:
green/blue translucent panels

Negative gates:
red translucent panels

Weapon unlock:
distinct container/crate

Projectiles:
small bright circles/lines

Road:
simple perspective lanes

The prototype must be visually readable even with placeholders.

The architecture must make it easy to replace placeholders with PNG/WebP/SVG/generated assets later.

---

# 20. GAME FEEL

Game feel is extremely important.

Implement subtle effects such as:

### Shooting

* small muzzle flash
* projectile trail
* tiny recoil
* optional light haptic

### Enemy hit

* hit flash
* small particles
* floating damage number when appropriate

### Enemy death

* quick scale animation
* particles
* satisfying disappearance

### Gate activation

* number animation
* haptic
* particles when positive

### Boss attack

* screen shake
* stronger haptic
* impact particles

### Boss death

* stronger screen shake
* explosion
* particles
* temporary slow-motion feeling if feasible

Do not make effects computationally expensive.

Use pooling for frequently created objects such as particles and projectiles when appropriate.

---

# 21. PERFORMANCE

Target smooth gameplay on modern iPhones.

Aim for approximately 60 FPS.

Important:

Do NOT render each game entity as an individual React component.

Do NOT call setState every frame.

Avoid unnecessary allocations inside the game loop.

Reuse objects when practical.

Cap visual soldiers.

Cap particles.

Use object pooling where useful.

Separate logical army size from visual army size.

The game should remain smooth even when armySize becomes very large.

---

# 22. GAME LOOP

Implement a proper delta-time based game loop.

Conceptually:

```text
INPUT
↓
UPDATE PLAYER
↓
UPDATE SHOOTING
↓
UPDATE PROJECTILES
↓
UPDATE ENEMIES
↓
COLLISIONS
↓
UPDATE GATES
↓
UPDATE BOSS
↓
SPAWN / WORLD GENERATION
↓
DIFFICULTY
↓
RENDER
```

Game behavior must not depend on frame rate.

---

# 23. COLLISIONS

Keep collisions simple.

Use circles or rectangles.

We do not need realistic physics.

Required collisions:

```text
projectile -> enemy
projectile -> boss
projectile -> shootable gate
projectile -> weapon unlock

army -> gate
army -> enemy
army -> boss
army -> power-up
```

Optimize collision checks so we do not compare every object against every other object unnecessarily.

---

# 24. SCORE

Primary score:

DISTANCE.

Display continuously:

```text
1,427 m
```

Also show:

```text
BEST: 3,891 m
```

Persist best score locally.

Distance should increase continuously while alive.

---

# 25. HUD

Keep the gameplay UI minimal.

Top left:

```text
👥 87
```

Top center:

```text
1,482 m
```

Top right:

current weapon.

Do not clutter the screen.

---

# 26. HOME SCREEN

Simple MVP home screen.

Display:

Game title

Best distance

Large:

PLAY

button.

No authentication.

No account.

No shop yet.

No advertisements yet.

---

# 27. GAME OVER

When:

```text
armySize <= 0
```

Stop the simulation.

Display:

```text
GAME OVER

DISTANCE
2,847 m

BEST
4,102 m

PLAY AGAIN
```

If a new record was achieved:

```text
NEW BEST!
```

Make restarting extremely fast.

The player should be able to go from death to another run in one tap.

---

# 28. FUTURE MONETIZATION — DO NOT IMPLEMENT YET

Design the architecture so rewarded advertisements can later be added.

Potential future mechanic:

When the player dies:

```text
CONTINUE RUN
Watch Ad
```

After watching:

restore approximately 30-50% of the recent army or a configurable minimum army.

Only allow a limited number of revives per run.

DO NOT integrate an ad SDK now.

---

# 29. FUTURE META-GAME — DO NOT IMPLEMENT YET

The game may later include:

* soldier skins
* weapon skins
* environments
* coins
* achievements
* trophies
* Game Center leaderboards
* daily missions
* daily challenges
* unlockable visual effects
* statistics
* progression
* seasonal content

Do NOT build these systems yet.

However, avoid architectural decisions that would make them difficult to add.

---

# 30. CONFIGURATION-FIRST DESIGN

Almost every balancing value should be configurable.

Examples:

```text
starting army size
base movement speed
lane positions
shooting rate
weapon damage
enemy HP
enemy speed
enemy spawn frequency
boss interval
boss HP
boss damage
boss attack interval
gate probabilities
gate values
shootable gate progression
weapon unlock cost
difficulty scaling
max visible soldiers
particle limits
```

I want to be able to tweak the game's balancing without editing core game logic.

---

# 31. DEBUG TOOLS

Development/debugging is important.

Create a development-only debug overlay that can display:

```text
FPS
distance
difficulty
armySize
visibleSoldiers
enemyCount
projectileCount
currentWeapon
nextBossDistance
```

Also make it easy during development to:

* add 100 soldiers
* spawn a boss
* change weapon
* increase distance
* restart

These debug controls must not appear in production builds.

---

# 32. TESTING

Core game logic should be testable independently from rendering.

Write unit tests for important deterministic systems such as:

* gate arithmetic
* army size calculations
* difficulty scaling
* boss damage
* weapon damage
* procedural generation constraints
* game-over conditions

Do not waste time snapshot-testing visual components.

Focus tests on gameplay logic.

---

# 33. CODE QUALITY

Use strict TypeScript.

Avoid `any`.

Use descriptive names.

Keep functions reasonably small.

Avoid giant files.

Avoid duplicated game logic.

Add comments only where they explain non-obvious game behavior.

Do not create abstractions just for the sake of abstraction.

Prefer simple, readable code.

---

# 34. IMPORTANT DESIGN PRINCIPLE

The game should be understandable within approximately 5 seconds without a tutorial.

The player should intuitively understand:

* move left/right
* soldiers shoot automatically
* positive number = good
* negative number = bad
* shooting gates can improve them
* kill enemies before they reach you
* grow the army
* survive as long as possible

For the first run, subtle visual guidance can indicate horizontal movement.

Avoid long tutorial dialogs.

---

# 35. CORE GAMEPLAY FEEL

The central fantasy is:

> Start weak and gradually build an absurdly powerful army.

A successful run should visually evolve from:

```text
1 soldier
```

to:

```text
5
```

to:

```text
20
```

to:

```text
100
```

to:

```text
500+
```

while enemies and bosses become increasingly dangerous.

The player should constantly feel:

"I just need to survive a little longer."

Near-death recoveries should be possible.

Example:

```text
Army: 230

Boss attack
→ 180

Boss attack
→ 130

Boss attack
→ 80

Boss attack
→ 30

Boss dies.

Next section:

+50 gate

Army: 80

Then ×2 gate

Army: 160
```

These comeback moments are desirable.

---

# 36. RANDOMNESS AND FAIRNESS

Procedural generation must feel random without feeling unfair.

Use seeded/randomized generation architecture where practical so problematic runs can later be reproduced during debugging.

Never create unavoidable death solely because of procedural generation.

The player should generally be able to identify a better choice.

Difficulty should come from:

* reaction speed
* choosing lanes
* prioritizing targets
* army management

not invisible randomness.

---

# 37. FIRST IMPLEMENTATION PLAN

Do NOT attempt every feature simultaneously.

Build incrementally.

## Phase 1 — Core runner

Implement:

* game screen
* pseudo-3D road
* three lanes
* player army placeholder
* endless forward movement
* horizontal controls
* distance score

Make sure this works before continuing.

## Phase 2 — Shooting

Implement:

* automatic shooting
* projectiles
* basic enemy
* enemy HP
* enemy death

## Phase 3 — Army

Implement:

* armySize
* visual crowd
* dynamic formation
* army deaths

## Phase 4 — Gates

Implement:

* +N
* -N
* ×N
* lane choices

## Phase 5 — Shootable gates

Implement:

* evolving gate values
* projectile interaction
* visual feedback

## Phase 6 — Weapons

Implement:

* weapon configurations
* unlock objects
* pistol
* SMG
* shotgun
* machine gun

## Phase 7 — Boss

Implement:

* boss spawning
* boss HP
* boss movement
* repeated soldier-killing attack
* boss death

## Phase 8 — Procedural generation

Implement:

* reusable segments
* weighted generation
* increasing difficulty
* fairness constraints

## Phase 9 — Game feel

Implement:

* particles
* screen shake
* haptics
* hit feedback
* transitions

## Phase 10 — Persistence

Implement:

* best score
* home screen
* game over
* instant restart

---

# 38. HOW I WANT YOU TO WORK

Before writing significant amounts of code:

1. Inspect the existing project if one exists.
2. Determine the installed Expo / React Native versions.
3. Verify library compatibility before installing dependencies.
4. Propose the concrete file architecture.
5. Identify the minimum dependencies required.
6. Implement Phase 1 first.

Do NOT generate the entire game blindly in one massive response.

Work incrementally.

After each phase:

* run TypeScript checks
* fix errors
* run relevant tests
* verify imports
* verify that the app builds
* do not leave placeholder TODOs for functionality that should already work

If something fails, diagnose the actual error instead of randomly rewriting unrelated code.

Do not downgrade Expo or React Native unless absolutely necessary.

Use libraries compatible with the project's current Expo SDK.

---

# 39. ASSET STRATEGY

Initially use programmatic placeholder graphics.

Do NOT block development because final artwork is unavailable.

Create the rendering architecture so placeholders can later be replaced with generated assets.

Keep asset references centralized.

Later I will provide or generate:

* soldiers
* enemies
* bosses
* weapons
* gates
* road/environment
* particles/effects
* UI elements

When final assets are introduced, preserve gameplay dimensions independently from sprite dimensions.

Collision boxes must NOT depend directly on PNG dimensions.

---

# 40. CAMERA / VISUAL GOAL

The desired feeling is similar to a forward-moving mobile runner.

The army remains primarily near the lower portion of the screen.

Objects spawn near the horizon and approach the army.

The player feels like they are continuously advancing through the world.

The camera itself does not need true 3D.

Use mathematical pseudo-perspective.

The visual priority is:

READABILITY > REALISM.

At all times the player must clearly see:

* their army
* upcoming gates
* enemies
* important numbers
* weapon unlocks
* boss HP

---

# 41. MVP SUCCESS CRITERIA

The MVP is successful when I can:

1. Launch the game.
2. Tap Play.
3. Start with one soldier.
4. Move between three lanes.
5. Automatically shoot.
6. Kill enemies.
7. Choose mathematical gates.
8. Increase/decrease my army.
9. Shoot gates to improve their values.
10. Unlock stronger weapons.
11. Encounter bosses.
12. Fight bosses while they progressively kill my soldiers.
13. Survive the boss and continue the SAME run.
14. Experience continuously increasing difficulty.
15. Eventually lose my entire army.
16. See my distance.
17. See my best score.
18. Tap once and immediately start another run.

There must be NO finite level system.

The game loop is:

**RUN → GROW → CHOOSE → SHOOT → SURVIVE → BOSS → CONTINUE → DIE → BEAT HIGH SCORE → RESTART**

---
