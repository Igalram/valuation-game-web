export type SoundEffect = "type_tick" | "question_start" | "correct" | "wrong";

export class GameAudio {
  private readonly music: HTMLAudioElement;
  private muted: boolean;

  constructor(
    muted: boolean,
    private readonly onError: (message: string) => void,
  ) {
    this.muted = muted;
    this.music = new Audio(`${import.meta.env.BASE_URL}audio/music/valuation_theme.mp3`);
    this.music.loop = true;
    this.music.volume = 0.2;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.music.muted = muted;
    if (!muted) this.play(this.music, "music");
  }

  startMusic(): void {
    if (!this.muted) this.play(this.music, "music");
  }

  effect(name: SoundEffect): void {
    if (this.muted) return;
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/sfx/${name}.wav`);
    audio.volume = name === "type_tick" ? 0.5 : 0.8;
    this.play(audio, name);
  }

  private play(audio: HTMLAudioElement, label: string): void {
    const playback = audio.play();
    if (playback) {
      void playback.catch(() => {
        this.onError(`Audio playback failed (${label}). Check the browser's audio permissions.`);
      });
    }
  }
}
