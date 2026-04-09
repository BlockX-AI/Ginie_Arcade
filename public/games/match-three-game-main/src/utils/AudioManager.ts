class AudioManager {
  private static instance: AudioManager;
  private bgMusic: HTMLAudioElement | null = null;
  private menuMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private bgMusicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  playBackgroundMusic() {
    if (this.isMuted) return;
    
    if (this.bgMusic) {
      this.bgMusic.pause();
    }

    this.bgMusic = new Audio('/music/bg_music.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.bgMusicVolume;
    this.bgMusic.play().catch(err => console.log('Audio play failed:', err));
  }

  playMenuMusic() {
    if (this.isMuted) return;
    
    if (this.menuMusic) {
      this.menuMusic.pause();
    }

    this.menuMusic = new Audio('/music/menu_music.mp3');
    this.menuMusic.loop = true;
    this.menuMusic.volume = this.bgMusicVolume;
    this.menuMusic.play().catch(err => console.log('Audio play failed:', err));
  }

  stopBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.pause();
      this.menuMusic.currentTime = 0;
    }
  }

  playMatchSound() {
    if (this.isMuted) return;
    
    const sfx = new Audio('/music/win_level.wav');
    sfx.volume = this.sfxVolume * 0.3;
    sfx.play().catch(err => console.log('SFX play failed:', err));
  }

  playSwapSound() {
    if (this.isMuted) return;
    
    const sfx = new Audio('/music/win_level.wav');
    sfx.volume = this.sfxVolume * 0.2;
    sfx.playbackRate = 1.5;
    sfx.play().catch(err => console.log('SFX play failed:', err));
  }

  playGameOverSound() {
    if (this.isMuted) return;
    
    const sfx = new Audio('/music/win_level.wav');
    sfx.volume = this.sfxVolume;
    sfx.play().catch(err => console.log('SFX play failed:', err));
  }

  playVictorySound() {
    if (this.isMuted) return;
    
    const sfx = new Audio('/music/win_level.wav');
    sfx.volume = this.sfxVolume * 0.8;
    sfx.play().catch(err => console.log('SFX play failed:', err));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      if (this.bgMusic) this.bgMusic.volume = 0;
      if (this.menuMusic) this.menuMusic.volume = 0;
    } else {
      if (this.bgMusic) this.bgMusic.volume = this.bgMusicVolume;
      if (this.menuMusic) this.menuMusic.volume = this.bgMusicVolume;
    }
    
    return this.isMuted;
  }

  getMuteState(): boolean {
    return this.isMuted;
  }
}

export default AudioManager;
