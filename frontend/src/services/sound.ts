import { Audio } from 'expo-av';

type SoundName =
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'gameStart'
  | 'gameEnd'
  | 'ropePull'
  | 'buttonPress'
  | 'countdown';

const SOUND_FILES: Record<SoundName, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  tick: require('../../assets/sounds/tick.mp3'),
  gameStart: require('../../assets/sounds/game-start.mp3'),
  gameEnd: require('../../assets/sounds/game-end.mp3'),
  ropePull: require('../../assets/sounds/rope-pull.mp3'),
  buttonPress: require('../../assets/sounds/button-press.mp3'),
  countdown: require('../../assets/sounds/countdown.mp3'),
};

class SoundService {
  private sounds: Map<SoundName, Audio.Sound> = new Map();
  private loaded = false;

  async loadAll() {
    if (this.loaded) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const entries = Object.entries(SOUND_FILES) as [SoundName, number][];
    await Promise.all(
      entries.map(async ([name, source]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(source);
          this.sounds.set(name, sound);
        } catch (err) {
          console.warn(`Failed to load sound: ${name}`, err);
        }
      }),
    );

    this.loaded = true;
  }

  async play(name: SoundName) {
    const sound = this.sounds.get(name);
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (err) {
      console.warn(`Failed to play sound: ${name}`, err);
    }
  }

  async unloadAll() {
    await Promise.all(
      Array.from(this.sounds.values()).map((sound) =>
        sound.unloadAsync().catch(() => {}),
      ),
    );
    this.sounds.clear();
    this.loaded = false;
  }
}

export const soundService = new SoundService();
