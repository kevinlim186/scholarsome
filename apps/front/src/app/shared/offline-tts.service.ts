import { Injectable, EventEmitter } from "@angular/core";
import { pipeline, env } from "@xenova/transformers";

@Injectable({
  providedIn: "root"
})
export class OfflineTTSService {
  public downloadProgress = new EventEmitter<number>();
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
    if (this.isLoaded) return;
    console.log(`Downloading high-quality offline voice for ${lang}...`);

    env.allowLocalModels = false;

    if (!this.synthesizer) {
      this.synthesizer = await pipeline("text-to-speech", this.voiceMap[lang] || this.voiceMap["en-US"], {
        progress_callback: (progress: any) => {
          if (progress.status === "progress") {
            this.downloadProgress.emit(progress.progress);
          } else if (progress.status === "done") {
            this.downloadProgress.emit(100);
          }
        }
      });
    }
    this.isLoaded = true;
  }

  async speak(text: string, lang: string): Promise<void> {
    if (!this.isLoaded) {
      throw new Error("TTS is not ready. Please download the voice in settings.");
    }
    console.log(`Speaking high-quality offline (${lang}): ${text}`);

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
      console.error("Transformers.js TTS failed", e);
    }
  }

  isOfflineAvailable(): boolean {
    return this.isLoaded;
  }
}
