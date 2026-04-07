import { Injectable, EventEmitter } from "@angular/core";
import { pipeline, env } from "@xenova/transformers";

@Injectable({
  providedIn: "root"
})
export class OfflineTTSService {
  public downloadProgress = new EventEmitter<{ lang: string; progress: number }>();
  private synthesizers: { [key: string]: any } = {};
  private loadedLangs: { [key: string]: boolean } = {
    "en-US": false,
    "de-DE": false
  };

  private modelMap: { [key: string]: string } = {
    "en-US": "Xenova/vits-ljs",
    "de-DE": "Xenova/mms-tts-deu"
  };

  private hfToken: string | null = null;

  constructor() {
    this.hfToken = localStorage.getItem("HF_TOKEN");
  }

  setToken(token: string) {
    this.hfToken = token;
    localStorage.setItem("HF_TOKEN", token);
  }

  getToken(): string | null {
    return this.hfToken;
  }

  async downloadVoice(lang: string): Promise<void> {
    if (!this.modelMap[lang]) {
      throw new Error(`Unsupported language: ${lang}. Only en-US and de-DE are supported.`);
    }
    if (this.loadedLangs[lang]) return;

    console.log(`Downloading high-quality ${lang} voice (${this.modelMap[lang]})...`);

    env.allowLocalModels = false;

    const options: any = {
      progress_callback: (progress: any) => {
        if (progress.status === "progress") {
          this.downloadProgress.emit({ lang, progress: progress.progress });
        } else if (progress.status === "done") {
          this.downloadProgress.emit({ lang, progress: 100 });
        }
      }
    };

    if (this.hfToken) {
      // Transformers.js uses the fetch API, which respects headers.
      // We can pass the token via env configuration or custom fetch.
      (env as any).remoteHost = `https://huggingface.co`;
      (env as any).remotePathTemplate = `{model}/resolve/{revision}/{file}`;

      // Note: Passing token directly to fetch for private repo access
      const originalFetch = window.fetch;
      window.fetch = (input, init) => {
        if (typeof input === 'string' && input.includes('huggingface.co')) {
          init = init || {};
          init.headers = init.headers || {};
          (init.headers as any)['Authorization'] = `Bearer ${this.hfToken}`;
        }
        return originalFetch(input, init);
      };
    }

    try {
      this.synthesizers[lang] = await pipeline("text-to-speech", this.modelMap[lang], options);
      this.loadedLangs[lang] = true;
    } catch (e: any) {
      console.error(`Failed to download ${lang} TTS model`, e);
      this.downloadProgress.emit({ lang, progress: -1 });
      throw e;
    }
  }

  async removeVoice(lang: string): Promise<void> {
    delete this.synthesizers[lang];
    this.loadedLangs[lang] = false;
    this.downloadProgress.emit({ lang, progress: 0 });
    console.log(`Offline ${lang} voice removed.`);
  }

  async speak(text: string, lang: string): Promise<void> {
    const synthesizer = this.synthesizers[lang];
    if (!synthesizer) {
      throw new Error(`${lang} TTS is not ready. Please download it in settings.`);
    }

    try {
      const output = await synthesizer(text);

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
      console.error(`${lang} TTS synthesis failed`, e);
    }
  }

  isOfflineAvailable(lang: string): boolean {
    return this.loadedLangs[lang];
  }
}
