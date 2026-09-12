import { useEffect, useState, useCallback } from 'react';
import { socket } from './socket';
import type { Game, GameEvent } from './types';

import LandingScreen   from './components/LandingScreen';
import CreateScreen    from './components/CreateScreen';
import JoinScreen      from './components/JoinScreen';
import LobbyScreen     from './components/LobbyScreen';
import CountdownScreen from './components/CountdownScreen';
import GameScreen      from './components/GameScreen';
import ResultsScreen   from './components/ResultsScreen';
import AdminDashboard  from './components/AdminDashboard';
import ProjectorView   from './components/ProjectorView';
import Notification    from './components/Notification';

export type Screen =
  | 'landing' | 'create' | 'join' | 'lobby'
  | 'countdown' | 'game' | 'results'
  | 'admin' | 'projector';

export interface AppState {
  screen: Screen;
  game: Game | null;
  myPlayerId: string | null;
  joinCode: string;
  countdown: number;
  notification: { text: string; color?: string } | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: 'landing',
    game: null,
    myPlayerId: null,
    joinCode: '',
    countdown: 0,
    notification: null,
  });

  const notify = useCallback((text: string, color?: string) => {
    setState(s => ({ ...s, notification: { text, color } }));
    setTimeout(() => setState(s => ({ ...s, notification: null })), 3500);
  }, []);

  const setScreen = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen }));
  }, []);

  useEffect(() => {
    socket.on('game-created', ({ joinCode }) => {
      setState(s => ({ ...s, joinCode, screen: 'lobby' }));
    });

    socket.on('game-state', (game) => {
      setState(s => {
        let screen = s.screen;
        if (game.status === 'LOBBY' && screen !== 'lobby' && screen !== 'create') {
          screen = 'lobby';
        }
        if (game.status === 'FINISHED' && screen !== 'results') {
          screen = 'results';
        }
        return { ...s, game, screen };
      });
    });

    socket.on('game-started', (game) => {
      setState(s => ({ ...s, game, screen: 'countdown' }));
    });

    socket.on('countdown', (count) => {
      setState(s => ({ ...s, countdown: count }));
      if (count <= 0) {
        setTimeout(() => setState(s => ({ ...s, screen: 'game' })), 800);
      }
    });

    socket.on('error-message', (msg) => {
      notify('❌ ' + msg, '#ff3b6b');
    });

    socket.on('game-event', (ev: GameEvent) => {
      notify(ev.message);
    });

    socket.on('player-interrupted', ({ victimId }) => {
      setState(s => {
        if (s.myPlayerId === victimId) {
          return { ...s, notification: { text: '💥 YOUR PATH WAS CUT!', color: '#ff3b6b' } };
        }
        return s;
      });
      setTimeout(() => setState(s => ({ ...s, notification: null })), 3000);
    });

    return () => {
      socket.off('game-created');
      socket.off('game-state');
      socket.off('game-started');
      socket.off('countdown');
      socket.off('error-message');
      socket.off('game-event');
      socket.off('player-interrupted');
    };
  }, [notify]);

  const { screen, game, myPlayerId, joinCode, countdown, notification } = state;

  // Projector view — separate page
  if (screen === 'projector') {
    return <ProjectorView game={game} onBack={() => setScreen('landing')} />;
  }

  // Admin view
  if (screen === 'admin') {
    return (
      <AdminDashboard
        game={game}
        onBack={() => setScreen('landing')}
        onCreateGame={(opts) => socket.emit('create-game', opts)}
        onPause={() => socket.emit('admin-pause')}
        onResume={() => socket.emit('admin-resume')}
        onEnd={() => socket.emit('admin-end')}
        onSwitchProjector={() => setScreen('projector')}
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {notification && (
        <Notification text={notification.text} color={notification.color} />
      )}

      {screen === 'landing' && (
        <LandingScreen
          onCreate={() => setScreen('create')}
          onJoin={() => setScreen('join')}
          onDemo={() => socket.emit('start-demo')}
          onAdmin={() => setScreen('admin')}
          onProjector={() => setScreen('projector')}
        />
      )}

      {screen === 'create' && (
        <CreateScreen
          onBack={() => setScreen('landing')}
          onCreate={(opts) => {
            socket.emit('create-game', opts);
          }}
        />
      )}

      {screen === 'join' && (
        <JoinScreen
          onBack={() => setScreen('landing')}
          onJoin={(code, username, avatar) => {
            setState(s => ({ ...s, joinCode: code }));
            socket.emit('join-game', { code, username, avatar });
          }}
          onSetPlayerId={(id) => setState(s => ({ ...s, myPlayerId: id }))}
          game={game}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          game={game}
          joinCode={joinCode}
          myPlayerId={myPlayerId}
          onStart={() => socket.emit('start-game')}
          onBack={() => setScreen('landing')}
          onSetPlayerId={(id) => setState(s => ({ ...s, myPlayerId: id }))}
        />
      )}

      {screen === 'countdown' && (
        <CountdownScreen count={countdown} />
      )}

      {screen === 'game' && (
        <GameScreen
          game={game}
          myPlayerId={myPlayerId}
          onMove={(pos) => socket.emit('player-move', pos)}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          game={game}
          myPlayerId={myPlayerId}
          onPlayAgain={() => setScreen('landing')}
        />
      )}
    </div>
  );
}
