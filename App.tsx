import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';

import { GameOverScreen } from './src/screens/GameOverScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';

type AppScreen = 'home' | 'game' | 'gameover';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [runId, setRunId] = useState(0);
  const [lastDistance, setLastDistance] = useState(0);
  const [bestDistance, setBestDistance] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const startRun = useCallback(() => {
    setIsNewBest(false);
    setRunId((value) => value + 1);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback(
    (distance: number) => {
      const nextBest = Math.max(bestDistance, distance);
      setLastDistance(distance);
      setBestDistance(nextBest);
      setIsNewBest(distance > bestDistance);
      setScreen('gameover');
    },
    [bestDistance],
  );

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen bestDistance={bestDistance} onPlay={startRun} />
      ) : null}
      {screen === 'game' ? (
        <GameScreen
          key={runId}
          onGameOver={handleGameOver}
          onExit={() => setScreen('home')}
        />
      ) : null}
      {screen === 'gameover' ? (
        <GameOverScreen
          distance={lastDistance}
          bestDistance={bestDistance}
          isNewBest={isNewBest}
          onPlayAgain={startRun}
        />
      ) : null}
    </>
  );
}
