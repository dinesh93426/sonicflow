"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProceduralTrack = generateProceduralTrack;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Generates an uncompressed 16-bit PCM Stereo WAV file with procedural musical chords / melodies.
 * Produces genuine, pristine audio playable in all modern browsers and audio players.
 */
function generateProceduralTrack(filePath, durationSeconds, baseFrequency, trackType) {
    const sampleRate = 44100;
    const numChannels = 2;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const totalSamples = sampleRate * durationSeconds;
    const dataSize = totalSamples * blockAlign;
    const buffer = Buffer.alloc(44 + dataSize);
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    let offset = 44;
    const notes = [1, 1.25, 1.334, 1.5, 1.667, 1.875, 2.0]; // Major scale intervals
    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        // Harmonic progression
        const barTime = (t % 8) / 8;
        const noteIndex = Math.floor(barTime * 4) % notes.length;
        const currentFreq = baseFrequency * notes[noteIndex];
        let left = 0;
        let right = 0;
        // Sine tone with subtle overtone harmonics
        const fundamental = Math.sin(2 * Math.PI * currentFreq * t);
        const fifth = Math.sin(2 * Math.PI * (currentFreq * 1.5) * t) * 0.4;
        const octave = Math.sin(2 * Math.PI * (currentFreq * 2) * t) * 0.25;
        // Subtle rhythmic pulse / envelope
        const pulse = Math.sin(2 * Math.PI * 2 * t); // 120 bpm pulse
        const envelope = 0.7 + 0.3 * Math.abs(pulse);
        if (trackType === 'synthwave') {
            const bass = Math.sin(2 * Math.PI * (baseFrequency * 0.5) * t) * 0.6;
            left = (fundamental + fifth + bass) * envelope * 0.4;
            right = (fundamental + octave + bass) * envelope * 0.4;
        }
        else if (trackType === 'lofi') {
            const warm = Math.sin(2 * Math.PI * (currentFreq * 0.75) * t) * 0.5;
            const flutter = Math.sin(2 * Math.PI * 0.5 * t) * 0.05;
            left = (fundamental * 0.6 + warm * 0.4 + flutter) * 0.4;
            right = (fundamental * 0.5 + warm * 0.5 - flutter) * 0.4;
        }
        else {
            // Ambient / Electronic
            left = (fundamental + fifth * 0.5) * 0.35;
            right = (fundamental + octave * 0.5) * 0.35;
        }
        // Convert to 16-bit signed integer (-32768 to 32767)
        const intLeft = Math.max(-32768, Math.min(32767, Math.floor(left * 32767)));
        const intRight = Math.max(-32768, Math.min(32767, Math.floor(right * 32767)));
        buffer.writeInt16LE(intLeft, offset);
        buffer.writeInt16LE(intRight, offset + 2);
        offset += 4;
    }
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    fs_1.default.writeFileSync(filePath, buffer);
}
