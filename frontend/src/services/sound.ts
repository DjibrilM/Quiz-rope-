import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

type SoundName =
  | "correct"
  | "wrong"
  | "tick"
  | "gameStart"
  | "gameEnd"
  | "ropePull"
  | "buttonPress"
  | "countdown";

const SOUND_FILES: Record<SoundName, number> = {
  correct: require("../../assets/sounds/correct.mp3"),
  wrong: require("../../assets/sounds/wrong.mp3"),
  tick: require("../../assets/sounds/tick.mp3"),
  gameStart: require("../../assets/sounds/game-start.mp3"),
  gameEnd: require("../../assets/sounds/game-end.mp3"),
  ropePull: require("../../assets/sounds/rope-pull.mp3"),
  buttonPress: require("../../assets/sounds/button-press.mp3"),
  countdown: require("../../assets/sounds/countdown.mp3"),
};

class SoundService {
  private players: Map<SoundName, AudioPlayer> = new Map();
  private loaded = false;

  async loadAll() {
    if (this.loaded) return;

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    });

    const entries = Object.entries(SOUND_FILES) as [SoundName, number][];
    for (const [name, source] of entries) {
      try {
        const player = createAudioPlayer(source);
        this.players.set(name, player);
      } catch (err) {
        console.warn(`Failed to load sound: ${name}`, err);
      }
    }

    this.loaded = true;
  }

  async play(name: SoundName) {
    const player = this.players.get(name);
    if (!player) return;

    try {
      await player.seekTo(0);
      player.play();
    } catch (err) {
      console.warn(`Failed to play sound: ${name}`, err);
    }
  }

  async unloadAll() {
    for (const player of this.players.values()) {
      try {
        player.remove();
      } catch {}
    }
    this.players.clear();
    this.loaded = false;
  }
}

export const soundService = new SoundService();
