import { BOSS_CONFIG } from '../config/bosses';
import { BOSS_FRAMES } from '../assets/bossAsset';
import { createEmptyBoss } from '../entities/boss';
import { pickBossSprite } from './bossAnimation';

describe('pickBossSprite', () => {
  it('stays static while approaching', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'approaching';
    boss.animTime = 2;
    expect(pickBossSprite(boss).body).toEqual(BOSS_FRAMES.idle[0]);
  });

  it('holds static pose before windup', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'fighting';
    boss.attackPhase = 'hold';
    expect(pickBossSprite(boss).body).toEqual(BOSS_FRAMES.idle[0]);
  });

  it('holds arms raised during windupHold', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'fighting';
    boss.attackPhase = 'windupHold';
    expect(pickBossSprite(boss).body).toEqual(
      BOSS_FRAMES.windup[BOSS_FRAMES.windup.length - 1],
    );
  });

  it('holds low pose with hands on ground after slam', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'fighting';
    boss.attackPhase = 'slamHold';
    expect(pickBossSprite(boss).body).toEqual(
      BOSS_FRAMES.slam[BOSS_FRAMES.slam.length - 1],
    );
  });

  it('stands still during recoverHold before the next windup', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'fighting';
    boss.attackPhase = 'recoverHold';
    expect(pickBossSprite(boss).body).toEqual(BOSS_FRAMES.idle[0]);
  });

  it('keeps the slam pose while taking hit flash', () => {
    const boss = createEmptyBoss();
    boss.behavior = 'fighting';
    boss.attackPhase = 'slamHold';
    boss.hitFlash = BOSS_CONFIG.hitFlashDuration;
    expect(pickBossSprite(boss).body).toEqual(
      BOSS_FRAMES.slam[BOSS_FRAMES.slam.length - 1],
    );
  });
});
