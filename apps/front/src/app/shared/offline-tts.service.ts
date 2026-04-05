import { Injectable } from "@angular/core";
import { pipeline } from "@xenova/transformers";

@Injectable({
  providedIn: "root"
})
export class OfflineTTSService {
  private synthesizer: any = null;
  private isLoaded = false;
  private voiceMap: { [key: string]: string } = {
    "en-US": "Xenova/speecht5_tts",
    "de-DE": "Xenova/speecht5_tts",
    "es-ES": "Xenova/speecht5_tts",
    "fr-FR": "Xenova/speecht5_tts"
  };

  private speakerEmbeddingsUrl = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin";

  constructor() {}

  async downloadVoice(lang: string): Promise<void> {
    console.log(`Downloading high-quality offline voice for ${lang}...`);
    if (!this.synthesizer) {
      this.synthesizer = await pipeline("text-to-speech", this.voiceMap[lang] || this.voiceMap["en-US"]);
    }
    this.isLoaded = true;
  }

  async speak(text: string, lang: string): Promise<void> {
    console.log(`Speaking high-quality offline (${lang}): ${text}`);
    if (!this.isLoaded) {
      await this.downloadVoice(lang);
    }

    try {
      const output = await this.synthesizer(text, {
        speaker_embeddings: this.speakerEmbeddingsUrl
      });

      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(
        1,
        output.audio.length,
        output.sampling_rate
      );
      audioBuffer.copyToChannel(output.audio, 0);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Transformers.js TTS failed, falling back to system TTS", e);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  isOfflineAvailable(lang: string): boolean {
    return this.isLoaded && !!this.voiceMap[lang];
  }
}
