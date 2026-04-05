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

  protected ttsProgress = 0;
  protected isTTSReady = false;

  constructor(private readonly ttsService: OfflineTTSService) {}

  ngOnInit() {
    this.isTTSReady = this.ttsService.isOfflineAvailable();
    this.ttsService.downloadProgress.subscribe(progress => {
      this.ttsProgress = progress;
      if (progress === 100) this.isTTSReady = true;
    });
  }

  downloadTTS() {
    this.ttsService.downloadVoice();
  }
}
