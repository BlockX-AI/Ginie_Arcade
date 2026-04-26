'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';

const REGISTRY_ADDRESS  = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS!;
const REWARD_ADDRESS    = process.env.NEXT_PUBLIC_REWARD_ADDRESS!;

const REGISTRY_ABI = [
  'function approveGame(bytes32 gameId, string uri) external',
  'function isApproved(bytes32 gameId) external view returns (bool)',
  'function owner() external view returns (address)',
];

const REWARD_ABI = [
  'function configureReward(bytes32 rewardId, uint64 xpAmount, bool unlockAchievement) external',
  'function rewards(bytes32) external view returns (uint64 xpAmount, bool unlockAchievement, bool enabled)',
  'function owner() external view returns (address)',
];

const ACTIVE_GAMES = [
  'flappy', 'snake-io', 'the-house', 'shooter',
  '8ball-pool', 'sudoku', 'zombie-apocalypse', 'match-three',
];

const REWARD_CONFIGS = [
  { type: 'FLAPPY_ROOKIE',       xp: 50  },
  { type: 'PIPE_MASTER',         xp: 200 },
  { type: 'PUZZLE_SOLVER',       xp: 100 },
  { type: 'LOGIC_MASTER',        xp: 300 },
  { type: 'NEURAL_GENIUS',       xp: 500 },
  { type: 'ZOMBIE_HUNTER',       xp: 50  },
  { type: 'ZOMBIE_SLAYER',       xp: 200 },
  { type: 'APOCALYPSE_SURVIVOR', xp: 500 },
  { type: 'POOL_ROOKIE',         xp: 100 },
  { type: 'BILLIARD_PRO',        xp: 300 },
  { type: 'POOL_CHAMPION',       xp: 750 },
  { type: 'SNAKE_ROOKIE',        xp: 50  },
  { type: 'SNAKE_MASTER',        xp: 200 },
  { type: 'SNAKE_LEGEND',        xp: 500 },
  { type: 'SHOOTER_ROOKIE',      xp: 50  },
  { type: 'SHOOTER_MASTER',      xp: 200 },
  { type: 'SHOOTER_ACE',         xp: 500 },
  { type: 'MATCH_ROOKIE',        xp: 50  },
  { type: 'MATCH_MASTER',        xp: 200 },
  { type: 'GEM_LEGEND',          xp: 500 },
  { type: 'HOUSE_EXPLORER',      xp: 50  },
  { type: 'HOUSE_MASTER',        xp: 200 },
];

type ItemStatus = 'pending' | 'checking' | 'ok' | 'running' | 'done' | 'error' | 'skip';

interface SetupItem {
  key: string;
  label: string;
  status: ItemStatus;
  txHash?: string;
  error?: string;
}

function buildProvider(walletClient: any) {
  const { chain, account, transport } = walletClient;
  const network = { chainId: chain.id, name: chain.name, ensAddress: undefined };
  const provider = new ethers.BrowserProvider(transport, network);
  return provider;
}

export default function AdminSetupPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [registryOwner, setRegistryOwner] = useState<string>('');
  const [rewardOwner, setRewardOwner] = useState<string>('');
  const [items, setItems] = useState<SetupItem[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const isOwner = address &&
    (address.toLowerCase() === registryOwner.toLowerCase() ||
     address.toLowerCase() === rewardOwner.toLowerCase());

  // Build initial item list
  useEffect(() => {
    const gameItems: SetupItem[] = ACTIVE_GAMES.map(slug => ({
      key: `game:${slug}`, label: `[Registry] Approve "${slug}"`, status: 'pending',
    }));
    const rewardItems: SetupItem[] = REWARD_CONFIGS.map(r => ({
      key: `reward:${r.type}`, label: `[Reward] Configure "${r.type}" (${r.xp} XP)`, status: 'pending',
    }));
    setItems([...gameItems, ...rewardItems]);
  }, []);

  // Fetch contract owners
  useEffect(() => {
    if (!walletClient) return;
    (async () => {
      try {
        const provider = buildProvider(walletClient);
        const reg = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
        const rew = new ethers.Contract(REWARD_ADDRESS, REWARD_ABI, provider);
        setRegistryOwner(await reg.owner());
        setRewardOwner(await rew.owner());
      } catch {}
    })();
  }, [walletClient]);

  function appendLog(msg: string) {
    setLog(prev => [...prev, msg]);
  }

  function setItemStatus(key: string, status: ItemStatus, extra?: Partial<SetupItem>) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, status, ...extra } : i));
  }

  async function runSetup() {
    if (!walletClient) return;
    setRunning(true);
    setLog([]);

    const provider = buildProvider(walletClient);
    const signer = await provider.getSigner();
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
    const rewardEngine = new ethers.Contract(REWARD_ADDRESS, REWARD_ABI, signer);

    // Approve games
    for (const slug of ACTIVE_GAMES) {
      const key = `game:${slug}`;
      setItemStatus(key, 'checking');
      const gameId = ethers.keccak256(ethers.toUtf8Bytes(slug));
      try {
        const already = await registry.isApproved(gameId);
        if (already) {
          setItemStatus(key, 'skip');
          appendLog(`[SKIP] ${slug} already approved`);
          continue;
        }
        setItemStatus(key, 'running');
        const tx = await registry.approveGame(gameId, `https://arcade.ginie.xyz/games/${slug}`);
        appendLog(`[TX]   ${slug} → ${tx.hash}`);
        const receipt = await tx.wait();
        setItemStatus(key, 'done', { txHash: receipt.hash });
        appendLog(`[OK]   ${slug} approved`);
      } catch (err: any) {
        setItemStatus(key, 'error', { error: err?.shortMessage ?? err?.message ?? String(err) });
        appendLog(`[ERR]  ${slug}: ${err?.shortMessage ?? err?.message}`);
      }
    }

    // Configure rewards
    for (const reward of REWARD_CONFIGS) {
      const key = `reward:${reward.type}`;
      setItemStatus(key, 'checking');
      const rewardId = ethers.keccak256(ethers.toUtf8Bytes(reward.type));
      try {
        const existing = await rewardEngine.rewards(rewardId);
        if (existing.enabled) {
          setItemStatus(key, 'skip');
          appendLog(`[SKIP] ${reward.type} already configured`);
          continue;
        }
        setItemStatus(key, 'running');
        const tx = await rewardEngine.configureReward(rewardId, BigInt(reward.xp), false);
        appendLog(`[TX]   ${reward.type} → ${tx.hash}`);
        const receipt = await tx.wait();
        setItemStatus(key, 'done', { txHash: receipt.hash });
        appendLog(`[OK]   ${reward.type} configured (${reward.xp} XP)`);
      } catch (err: any) {
        setItemStatus(key, 'error', { error: err?.shortMessage ?? err?.message ?? String(err) });
        appendLog(`[ERR]  ${reward.type}: ${err?.shortMessage ?? err?.message}`);
      }
    }

    setRunning(false);
    appendLog('=== Setup complete ===');
  }

  const statusColor: Record<ItemStatus, string> = {
    pending:  'text-gray-400',
    checking: 'text-yellow-400',
    ok:       'text-green-400',
    running:  'text-blue-400 animate-pulse',
    done:     'text-green-400',
    error:    'text-red-400',
    skip:     'text-gray-500',
  };

  const statusIcon: Record<ItemStatus, string> = {
    pending: '○', checking: '⟳', ok: '✓', running: '⟳', done: '✓', error: '✗', skip: '—',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-2 text-cyan-400">Contract Setup Admin</h1>
      <p className="text-gray-400 mb-6 text-sm">
        One-shot setup: approve all games in GinixGameRegistry + configure all rewards in GinixRewardEngine.<br />
        Must be connected with the <strong>contract owner wallet</strong>.
      </p>

      <div className="mb-6">
        <ConnectButton />
      </div>

      {walletClient && (
        <div className="mb-6 text-xs space-y-1 text-gray-400">
          <div>Registry owner: <span className="text-cyan-300">{registryOwner || '…'}</span></div>
          <div>Reward owner:   <span className="text-cyan-300">{rewardOwner || '…'}</span></div>
          <div>Connected:      <span className={isOwner ? 'text-green-400' : 'text-red-400'}>{address}</span>
            {isOwner ? ' ✓ Owner' : ' ✗ Not owner — cannot sign txs'}
          </div>
        </div>
      )}

      {isOwner && (
        <button
          onClick={runSetup}
          disabled={running}
          className="mb-8 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded text-sm font-bold transition"
        >
          {running ? 'Running…' : 'Run Full Setup'}
        </button>
      )}

      {/* Item list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 mb-8 text-xs">
        {items.map(item => (
          <div key={item.key} className="flex items-start gap-2">
            <span className={`${statusColor[item.status]} w-4 shrink-0`}>{statusIcon[item.status]}</span>
            <span className={item.status === 'error' ? 'text-red-300' : 'text-gray-300'}>{item.label}</span>
            {item.txHash && (
              <a
                href={`https://testnet.snowtrace.io/tx/${item.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-500 text-xs underline ml-1 shrink-0"
              >tx</a>
            )}
            {item.error && <span className="text-red-400 ml-1">{item.error}</span>}
          </div>
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 rounded p-4 text-xs text-green-300 whitespace-pre max-h-64 overflow-y-auto">
          {log.join('\n')}
        </div>
      )}
    </div>
  );
}
