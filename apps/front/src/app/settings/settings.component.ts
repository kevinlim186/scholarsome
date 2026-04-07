import { Component, OnInit } from "@angular/core";
import { faImage, faKey, faEnvelope, faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { OfflineTTSService } from "../shared/offline-tts.service";

@Component({
  selector: "scholarsome-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"]
})
export class SettingsComponent implements OnInit {
  protected readonly faImage = faImage;
  protected readonly faKey = faKey;
  protected readonly faEnvelope = faEnvelope;
  protected readonly faMicrophone = faMicrophone;

  protected ttsProgressEN = 0;
  protected isTTSReadyEN = false;
  protected ttsProgressDE = 0;
  protected isTTSReadyDE = false;
  protected hfToken = "";

  constructor(public readonly ttsService: OfflineTTSService) {}

  ngOnInit() {
    this.hfToken = this.ttsService.getToken() || "";
    this.isTTSReadyEN = this.ttsService.isOfflineAvailable("en-US");
    this.isTTSReadyDE = this.ttsService.isOfflineAvailable("de-DE");

    this.ttsService.downloadProgress.subscribe(data => {
      if (data.lang === "en-US") {
        this.ttsProgressEN = data.progress;
        if (data.progress === 100) this.isTTSReadyEN = true;
      } else if (data.lang === "de-DE") {
        this.ttsProgressDE = data.progress;
        if (data.progress === 100) this.isTTSReadyDE = true;
      }
    });
  }

  saveToken() {
    this.ttsService.setToken(this.hfToken);
    alert("Hugging Face token saved!");
  }

  downloadTTS(lang: string) {
    this.ttsService.downloadVoice(lang).catch(e => {
      alert(`Error: ${e.message}. If the model is restricted, please ensure your Hugging Face token is correct.`);
    });
  }

  removeTTS(lang: string) {
    this.ttsService.removeVoice(lang);
    if (lang === "en-US") {
      this.isTTSReadyEN = false;
      this.ttsProgressEN = 0;
    } else {
      this.isTTSReadyDE = false;
      this.ttsProgressDE = 0;
    }
  }
}
