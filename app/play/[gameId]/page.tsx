'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Clock, Trophy, Zap, AlertCircle, ArrowLeft, Sparkles, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { CONTRACTS, REWARD_ABI, gameIdToBytes32, rewardIdToBytes32 } from '@/lib/contracts';
import { isAddress } from 'viem';

const GAME_CONFIG: Record<string, { name: string; url: string; icon: string }> = {
  'neon-sky-runner': {
    name: 'Neon Sky Runner',
    url: '/games/neon-sky-runner/index.html',
    icon: '🚀',
  },
  'flappy': {
    name: 'Flappy Bird',
    url: '/games/flappy/index.html',
    icon: '🐦',
  },
  'snake-io': {
    name: 'Snake.io',
    url: '/games/snake-io/index.html',
    icon: '🐍',
  },
  'the-house': {
    name: 'The House',
    url: '/games/the-house-game/index.html',
    icon: '🏠',
  },
  'shooter': {
    name: 'Shooter',
    url: '/games/shooter/index.html',
    icon: '🚀',
  },
  '8ball-pool': {
    name: '8 Ball Pool',
    url: '/games/8ball-pool/index.html',
    icon: '🎱',
  },
  'sudoku': {
    name: 'Sudoku: Neural Grid',
    url: '/games/sudoku/index.html',
    icon: '🔢',
  },
  'zombie-apocalypse': {
    name: 'Zombie Apocalypse',
    url: '/games/zombie-apocalypse/index.html',
    icon: '🧟',
  },
  'project-abyss': {
    name: 'Project Abyss',
    url: '/games/project-abyss/index.html',
    icon: '⚓',
  },
  'aether-blade': {
    name: 'Aether Blade',
    url: '/games/aether-blade/index.html',
    icon: '⚔️',
  },
  'eclipse': {
    name: 'Eclipse',
    url: '/games/eclipse/index.html',
    icon: '🌙',
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
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // On-chain reward claiming
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'confirmed' | 'error'>('idle');
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | undefined>();

  const hasSubmitted = useRef(false);
  const { writeContractAsync } = useWriteContract();
  const { isSuccess: claimTxConfirmed } = useWaitForTransactionReceipt({ hash: claimTxHash });

  useEffect(() => {
    if (claimTxConfirmed && claimStatus === 'claiming') setClaimStatus('confirmed');
  }, [claimTxConfirmed, claimStatus]);

  const gameConfig = GAME_CONFIG[gameId];

  const autoRotateGames = ['aether-blade', 'project-abyss', 'eclipse'];
  const shouldAutoRotate = autoRotateGames.includes(gameId);

  const getDurationNow = useCallback(() => {
    if (!startTime) return elapsedTime;
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  }, [startTime, elapsedTime]);

  // Auto-submit score to backend
  const autoSubmitScore = useCallback(async (score: number, duration: number) => {
    if (hasSubmitted.current || !sessionId || !address) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submitScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, gameId, score, duration, wallet: address }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = typeof data?.error === 'string' ? data.error : 'Failed to submit score';
        throw new Error(msg);
      }
      setSubmitResult(data);
    } catch (err) {
      console.error('Auto-submit failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      hasSubmitted.current = false; // Allow retry
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, address, gameId]);

  // Claim reward on-chain
  const claimRewardOnChain = async () => {
    if (!submitResult?.reward || !address || !submitResult.reward.signature) return;

    const rewardContractAddress = CONTRACTS.reward;
    if (!rewardContractAddress || !isAddress(rewardContractAddress)) {
      setClaimStatus('error');
      setSubmitError('Reward contract address is not configured. Set NEXT_PUBLIC_REWARD_ADDRESS.');
      return;
    }

    setClaimStatus('claiming');
    try {
      const reward = submitResult.reward;
      const hash = await writeContractAsync({
        address: rewardContractAddress,
        abi: REWARD_ABI,
        functionName: 'grantReward',
        args: [
          `0x${reward.nonce}` as `0x${string}`,
          address,
          gameIdToBytes32(gameId),
          BigInt(currentScore),
          BigInt(elapsedTime),
          rewardIdToBytes32(reward.type) as `0x${string}`,
          reward.signature as `0x${string}`,
        ],
      });
      setClaimTxHash(hash);
    } catch (err) {
      console.error('Failed to claim reward on-chain:', err);
      setClaimStatus('error');
    }
  };

  // Pause site background music while game is running (so game audio is audible)
  useEffect(() => {
    if (!isConnected) return;
    window.dispatchEvent(new Event('ginix:pause-audio'));
    return () => {
      window.dispatchEvent(new Event('ginix:resume-audio'));
    };
  }, [isConnected]);

  // Validate that the game asset exists (prevents blank iframe / 404 render)
  useEffect(() => {
    if (!gameConfig) return;
    const check = async () => {
      try {
        const res = await fetch(gameConfig.url, { method: 'HEAD' });
        if (!res.ok) {
          setError('This game is not available yet. Please try another game from the library.');
        }
      } catch {
        setError('This game is not available yet. Please try another game from the library.');
      }
    };
    check();
  }, [gameConfig]);

  // Start session on mount
  useEffect(() => {
    if (!isConnected || !address) return;
    const startSession = async () => {
      try {
        const response = await fetch('/api/startSession', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address, gameId }),
        });
        if (!response.ok) throw new Error('Failed to start session');
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

  // Listen for messages from game iframe — AUTO-SUBMIT on game end
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data?.type) return;

      if (event.data.type === 'scoreUpdate') {
        setCurrentScore(event.data.score);
      }

      if (event.data.type === 'gameEnd') {
        const finalScore = event.data.score || currentScore;
        const duration = getDurationNow();
        setCurrentScore(finalScore);
        setElapsedTime(duration);
        setGameEnded(true);
        // Auto-submit immediately
        autoSubmitScore(finalScore, duration);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, address, startTime, currentScore, autoSubmitScore, getDurationNow]);

  if (!gameConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-12 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 gradient-text font-['Orbitron']">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game you're looking for doesn't exist.</p>
          <button onClick={() => router.push('/library')} className="cyber-gradient px-8 py-4 rounded-lg text-white font-bold hover:scale-105 transition-transform">Back to Library</button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <div className="section-container pt-28 pb-16 px-6">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson/10 border border-crimson/20">
              <Sparkles className="h-7 w-7 text-crimson" />
            </div>
            <h1 className="font-zentry text-3xl uppercase text-white">Connect Wallet to Play</h1>
            <p className="mt-3 font-circular-web text-sm leading-relaxed text-white/50">
              You need to connect your wallet to start a verified session, submit on-chain scores, and earn NFT achievements.
            </p>
            <div className="mt-8 flex items-center justify-center">
              <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
            <button
              onClick={() => router.push('/library')}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-general text-xs uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
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
        <div className="flex items-center justify-center pt-32">
          <div className="glass-card p-12 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => router.push('/library')} className="cyber-gradient px-8 py-4 rounded-lg text-white font-bold">Back to Library</button>
          </div>
        </div>
      </div>
    );
  }

  const xpEarned = submitResult?.xpEarned || 0;

  return (
    <div className={`fixed inset-0 flex flex-col bg-black ${(shouldAutoRotate && !gameEnded) ? 'auto-rotate-wrapper' : ''}`} data-game-page="true">
      <div className="flex-1 flex flex-col">
        {/* Stats Bar */}
        <div className="bg-black/80 border-b border-white/10 backdrop-blur-sm">
          <div className="section-container py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => router.push('/library')} className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-3 sm:gap-8">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cyber-gradient flex items-center justify-center">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Score</p>
                    <p className="font-['Orbitron'] text-base sm:text-xl text-white font-bold">{currentScore}</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg plasma-gradient flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-xl text-white font-bold">{elapsedTime}s</p>
                  </div>
                </div>

                {!gameEnded && (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
                      <Zap className="w-4 h-4 text-green-400 animate-pulse" />
                      <span className="text-sm text-green-400 font-bold">LIVE</span>
                    </div>
                    <button
                      onClick={() => {
                        const duration = getDurationNow();
                        setElapsedTime(duration);
                        setGameEnded(true);
                        // Neon Sky Runner doesn't print scores to console, needs manual input
                        if (gameId === 'neon-sky-runner' && currentScore === 0) {
                          const manualScore = prompt('Enter your Best score from the game:');
                          const score = manualScore ? parseInt(manualScore, 10) : 0;
                          if (score > 0) {
                            setCurrentScore(score);
                            setFinalScore(score);
                          }
                          autoSubmitScore(score || 0, duration);
                        } else {
                          setFinalScore(currentScore);
                          autoSubmitScore(currentScore, duration);
                        }
                      }}
                      className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-colors"
                    >
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                      <span className="text-xs sm:text-sm text-red-400 font-bold hidden sm:inline">End &amp; Submit</span>
                      <span className="text-xs text-red-400 font-bold sm:hidden">Submit</span>
                    </button>
                  </div>
                )}
                {gameEnded && isSubmitting && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-sm text-cyan-400 font-bold">SUBMITTING</span>
                  </div>
                )}
                {gameEnded && submitResult?.success && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-bold">+{xpEarned} XP</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={`${gameConfig.url}?sessionId=${sessionId}&nonce=${nonce}&wallet=${address}`}
            className="absolute inset-0 w-full h-full border-0"
            title={gameConfig.name}
            allow="accelerometer; gyroscope; autoplay"
          />
        </div>

        {/* Game Ended Overlay — auto-shown when bridge reports gameEnd */}
        {gameEnded && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-10 max-w-lg w-full mx-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 cyber-gradient opacity-10"></div>

              <div className="relative z-10 space-y-5">
                <div className="text-5xl">{gameConfig.icon}</div>
                <h2 className="text-3xl font-bold gradient-text font-['Orbitron']">Game Over!</h2>

                {/* Score */}
                <div>
                  <p className="text-sm text-gray-400">Final Score</p>
                  <p className="text-5xl font-['Orbitron'] font-bold gradient-text">{finalScore || currentScore}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="glass-card p-2 sm:p-3">
                    <p className="text-gray-400 text-xs mb-1">Time</p>
                    <p className="text-lg font-bold text-white">{elapsedTime}s</p>
                  </div>
                  <div className="glass-card p-2 sm:p-3">
                    <p className="text-gray-400 text-xs mb-1">XP Earned</p>
                    <p className="text-lg font-bold text-green-400">+{xpEarned}</p>
                  </div>
                  <div className="glass-card p-2 sm:p-3">
                    <p className="text-gray-400 text-xs mb-1">Status</p>
                    {isSubmitting && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />}
                    {submitResult?.success && <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />}
                    {submitError && <AlertCircle className="w-5 h-5 text-red-400 mx-auto" />}
                  </div>
                </div>

                {/* Auto-submit status */}
                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 text-cyan-400 py-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold">Recording score &amp; awarding XP...</span>
                  </div>
                )}

                {submitError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm mb-2">{submitError}</p>
                    <button
                      onClick={() => autoSubmitScore(finalScore || currentScore, elapsedTime)}
                      className="text-sm text-cyan-400 underline"
                    >
                      Retry submission
                    </button>
                  </div>
                )}

                {submitResult?.alreadyEnded && !submitError && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/70 text-sm">This session was already submitted.</p>
                    <p className="text-white/30 text-xs mt-1">Refresh the page to start a new run.</p>
                  </div>
                )}

                {/* Score submitted — show reward + NFT mint */}
                {submitResult?.success && (
                  <div className="space-y-3">
                    {/* Reward badge */}
                    {submitResult.reward && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          <span className="font-bold text-yellow-400">{submitResult.reward.type}</span>
                        </div>
                        <p className="text-xl font-bold gradient-text">+{submitResult.reward.xp} Bonus XP</p>

                        {submitResult.reward.signature && claimStatus === 'idle' && (
                          <button onClick={claimRewardOnChain} className="mt-3 w-full cyber-gradient px-4 py-2 rounded-lg text-white font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Claim On-Chain
                          </button>
                        )}
                        {claimStatus === 'claiming' && (
                          <div className="flex items-center justify-center gap-2 text-cyan-400 mt-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-bold">Confirming on Avalanche...</span>
                          </div>
                        )}
                        {claimStatus === 'confirmed' && claimTxHash && (
                          <div className="mt-3 text-center">
                            <p className="text-green-400 font-bold text-sm">Claimed on-chain!</p>
                            <a href={`https://testnet.snowtrace.io/tx/${claimTxHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 underline">View transaction</a>
                          </div>
                        )}
                        {claimStatus === 'error' && (
                          <button onClick={() => setClaimStatus('idle')} className="mt-2 text-sm text-cyan-400 underline">Retry claim</button>
                        )}
                      </div>
                    )}

                    {/* Score NFT (auto-minted server-side) */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <span className="font-bold text-cyan-400">Score NFT</span>
                      </div>
                      {submitResult?.scoreNFT ? (
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-sm mb-1">Score minted on-chain!</p>
                          <a
                            href={`https://testnet.snowtrace.io/tx/${submitResult.scoreNFT.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-400 underline"
                          >
                            <ExternalLink className="w-3 h-3" /> View on Snowtrace
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Your score is being minted as an NFT automatically...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="glass-card px-4 py-3 rounded-xl text-white font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/library')}
                    className="glass-card px-4 py-3 rounded-xl text-white font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm"
                  >
                    <Trophy className="w-4 h-4" /> Library
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="cyber-gradient px-4 py-3 rounded-xl text-white font-bold hover:scale-105 transition-transform text-sm"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {shouldAutoRotate && (
        <style>{`
          @media screen and (orientation: portrait) {
            .auto-rotate-wrapper {
              transform: rotate(90deg) translateY(-100%);
              transform-origin: top left;
              width: 100vh !important;
              width: 100dvh !important;
              height: 100vw !important;
              height: 100dvw !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              bottom: auto !important;
              right: auto !important;
              overflow: hidden;
              z-index: 9999;
            }
          }
        `}</style>
      )}
    </div>
  );
}
