'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Clock, Trophy, Zap, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

const GAME_CONFIG: Record<string, { name: string; url: string }> = {
  'neon-sky-runner': {
    name: 'Neon Sky Runner',
    url: '/games/neon-sky-runner/index.html',
  },
  'tilenova': {
    name: 'TileNova: Circuit Surge',
    url: '/games/tilenova/index.html',
  },
};

export default function GamePlayer() {
  const params = useParams();
  const gameId = params.gameId as string;
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [rewardData, setRewardData] = useState<any>(null);

  const gameConfig = GAME_CONFIG[gameId];

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected && !isLoading) {
      router.push('/');
    }
  }, [isConnected, isLoading, router]);

  // Start session on mount
  useEffect(() => {
    if (!isConnected || !address) return;

    const startSession = async () => {
      try {
        const response = await fetch('/api/startSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: address,
            gameId: gameId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start session');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        setNonce(data.nonce);
        setStartTime(Date.now());
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start session');
        setIsLoading(false);
      }
    };

    startSession();
  }, [address, isConnected, gameId]);

  // Timer
  useEffect(() => {
    if (!startTime || gameEnded) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameEnded]);

  // Listen for messages from game iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log('[Game Player] Received message:', event.data);
      
      if (event.data.type === 'scoreUpdate') {
        setCurrentScore(event.data.score);
      }

      if (event.data.type === 'gameEnd') {
        setGameEnded(true);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        
        try {
          const response = await fetch('/api/submitScore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              wallet: address,
              gameId,
              score: event.data.score || currentScore,
              duration,
            }),
          });

          const result = await response.json();
          
          if (result.reward) {
            setRewardData(result.reward);
          }
        } catch (err) {
          console.error('Failed to submit score:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, address, gameId, startTime, currentScore]);

  if (!gameConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-12 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 gradient-text font-['Orbitron']">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="cyber-gradient px-8 py-4 rounded-lg text-white font-bold hover:scale-105 transition-transform"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl text-gray-400">Initializing game session...</p>
            <p className="text-sm text-gray-500 mt-2">Setting up anti-cheat protection</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="glass-card p-12 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="cyber-gradient px-8 py-4 rounded-lg text-white font-bold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col pt-20">
        {/* Stats Bar */}
        <div className="bg-black/80 border-b border-white/10 backdrop-blur-sm">
          <div className="section-container py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg cyber-gradient flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-['Orbitron'] text-xl text-white font-bold">{currentScore}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg plasma-gradient flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-xl text-white font-bold">{elapsedTime}s</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
                  <Zap className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-sm text-green-400 font-bold">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="flex-1 relative">
          <iframe
            src={`${gameConfig.url}?sessionId=${sessionId}&nonce=${nonce}&wallet=${address}`}
            className="w-full h-full border-0"
            title={gameConfig.name}
            allow="accelerometer; gyroscope; autoplay"
          />
        </div>

        {/* Game Ended Overlay */}
        {gameEnded && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-12 max-w-lg text-center relative overflow-hidden">
              <div className="absolute inset-0 cyber-gradient opacity-10"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-4xl font-bold gradient-text mb-2 font-['Orbitron']">Game Over!</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Final Score</p>
                    <p className="text-6xl font-['Orbitron'] font-bold gradient-text">{currentScore}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="glass-card p-4">
                      <p className="text-gray-400 mb-1">Time</p>
                      <p className="text-2xl font-bold text-white">{elapsedTime}s</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-gray-400 mb-1">Score/sec</p>
                      <p className="text-2xl font-bold text-white">
                        {elapsedTime > 0 ? Math.round(currentScore / elapsedTime) : 0}
                      </p>
                    </div>
                  </div>

                  {rewardData && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-lg font-bold text-yellow-400">Reward Earned!</span>
                      </div>
                      <p className="text-2xl font-bold gradient-text mb-1">{rewardData.xp} XP</p>
                      <p className="text-sm text-gray-400">{rewardData.type}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 cyber-gradient px-8 py-4 rounded-xl text-white font-bold hover:scale-105 transition-transform"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-8 py-4 rounded-xl glass-card hover:bg-white/10 text-white transition-colors"
                  >
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
