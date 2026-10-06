// Ginix Bridge - Connect game to arcade backend
class GinixBridge {
  constructor() {
    this.sessionId = null;
    this.gameId = 'match-three';
    this.startTime = null;
    this.apiBase = this.getApiBase();
  }

  getApiBase() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  }

  async startSession(walletAddress) {
    try {
      this.startTime = Date.now();
      const response = await fetch(`${this.apiBase}/api/startSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          gameId: this.gameId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      console.log('[Ginix] Session started:', this.sessionId);
      return data;
    } catch (error) {
      console.error('[Ginix] Error starting session:', error);
      return null;
    }
  }

  async submitScore(walletAddress, score) {
    if (!this.sessionId) {
      console.error('[Ginix] No session ID - cannot submit score');
      return null;
    }

    try {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      
      const response = await fetch(`${this.apiBase}/api/submitScore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          wallet: walletAddress,
          gameId: this.gameId,
          score: score,
          duration: duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      const data = await response.json();
      console.log('[Ginix] Score submitted:', data);
      return data;
    } catch (error) {
      console.error('[Ginix] Error submitting score:', error);
      return null;
    }
  }

  getWalletAddress() {
    // Try to get wallet from URL params
    const params = new URLSearchParams(window.location.search);
    const wallet = params.get('wallet');
    
    if (wallet) {
      return wallet;
    }

    // Fallback to localStorage or default
    return localStorage.getItem('walletAddress') || '0x0000000000000000000000000000000000000000';
  }
}

window.GinixBridge = GinixBridge;
