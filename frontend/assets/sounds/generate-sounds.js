#!/usr/bin/env node
/**
 * Generate simple WAV sound effects for QuizRope.
 * Run: node generate-sounds.js
 * Creates .mp3 files (actually WAV format, renamed — expo-av plays both).
 */

const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, channels, samples) {
  const dataLength = samples.length * 2; // 16-bit PCM
  const buffer = Buffer.alloc(44 + dataLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
  buffer.writeUInt16LE(channels * 2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
  }

  return buffer;
}

function generateTone(freq, durationMs, sampleRate = 44100) {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, (numSamples - i) / (sampleRate * 0.05)); // fade out
    samples[i] = Math.sin(2 * Math.PI * freq * t) * 0.6 * envelope;
  }
  return samples;
}

function generateSweep(startFreq, endFreq, durationMs, sampleRate = 44100) {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = startFreq + (endFreq - startFreq) * progress;
    const envelope = Math.min(1, (numSamples - i) / (sampleRate * 0.03));
    samples[i] = Math.sin(2 * Math.PI * freq * t) * 0.5 * envelope;
  }
  return samples;
}

function generateChord(freqs, durationMs, sampleRate = 44100) {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, i / (sampleRate * 0.01));
    const fadeOut = Math.min(1, (numSamples - i) / (sampleRate * 0.1));
    let val = 0;
    for (const freq of freqs) {
      val += Math.sin(2 * Math.PI * freq * t);
    }
    samples[i] = (val / freqs.length) * 0.5 * fadeIn * fadeOut;
  }
  return samples;
}

function combineSamples(...arrays) {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Float64Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function saveWav(name, samples) {
  const buffer = createWavBuffer(44100, 1, samples);
  const filePath = path.join(__dirname, `${name}.mp3`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created ${name}.mp3 (${buffer.length} bytes)`);
}

// --- Generate all sounds ---

// Correct: ascending chime C5 -> E5
saveWav('correct', combineSamples(
  generateTone(523, 150), // C5
  generateTone(659, 200), // E5
));

// Wrong: descending buzz E4 -> C4
saveWav('wrong', combineSamples(
  generateSweep(330, 262, 400),
));

// Tick: short click
saveWav('tick', generateTone(1000, 50));

// Game start: rising whistle
saveWav('game-start', generateSweep(262, 523, 500));

// Game end: fanfare chord C4+E4+G4
saveWav('game-end', generateChord([262, 330, 392], 800));

// Rope pull: low thud
saveWav('rope-pull', generateTone(150, 200));

// Button press: soft pop
saveWav('button-press', generateTone(800, 80));

// Countdown: urgent double tick
saveWav('countdown', combineSamples(
  generateTone(1200, 50),
  new Float64Array(Math.floor(44100 * 0.05)), // 50ms gap
  generateTone(1200, 50),
));

console.log('\nAll sounds generated!');
