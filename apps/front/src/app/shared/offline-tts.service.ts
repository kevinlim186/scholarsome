import { Injectable, EventEmitter } from "@angular/core";
import { pipeline, env } from "@xenova/transformers";

@Injectable({
  providedIn: "root"
})
export class OfflineTTSService {
  public downloadProgress = new EventEmitter<number>();
  private synthesizer: any = null;
  private isLoaded = false;

  // Use high-quality VITS model for natural speech
  private modelName = "Xenova/vits-ljs";

  constructor() {
    // Check if model is already in cache on init
    this.checkStatus();
  }

  private async checkStatus() {
    // In a real browser, we'd check IndexedDB/Cache API
    // For now, we rely on the isLoaded flag set after download
  }

  async downloadVoice(): Promise<void> {
    if (this.isLoaded) return;
    console.log(`Downloading superior quality offline voice (${this.modelName})...`);

    env.allowLocalModels = false;

    try {
      this.synthesizer = await pipeline("text-to-speech", this.modelName, {
        progress_callback: (progress: any) => {
          if (progress.status === "progress") {
            this.downloadProgress.emit(progress.progress);
          } else if (progress.status === "done") {
            this.downloadProgress.emit(100);
          }
        }
      });
      this.isLoaded = true;
    } catch (e) {
      console.error("Failed to download TTS model", e);
      this.downloadProgress.emit(-1); // Error state
    }
  }

  async removeVoice(): Promise<void> {
    this.synthesizer = null;
    this.isLoaded = false;
    this.downloadProgress.emit(0);
    // In production, we would also clear the Transformers.js cache for this model
    console.log("Offline voice removed.");
  }

  async speak(text: string, lang: string): Promise<void> {
    if (!this.isLoaded) {
      throw new Error("Superior TTS is not ready. Please download it in settings.");
    }

    try {
      // VITS models generate high quality audio directly
      const output = await this.synthesizer(text);

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
      console.error("Superior TTS synthesis failed", e);
    }
  }

  isOfflineAvailable(): boolean {
    return this.isLoaded;
  }
}
