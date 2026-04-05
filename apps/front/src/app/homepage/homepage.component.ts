import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { User } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { UsersService } from "../shared/http/users.service";
import { faPlus, faClone, faFolder, faSync, faWifi } from "@fortawesome/free-solid-svg-icons";
import { OfflineStorageService } from "../shared/offline-storage.service";
import { SetsService } from "../shared/http/sets.service";

@Component({
  selector: "scholarsome-view",
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.scss"]
})
export class HomepageComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly setsService: SetsService,
    private readonly offlineStorage: OfflineStorageService,
    private readonly titleService: Title,
    private readonly metaService: Meta
  ) {
    this.titleService.setTitle("Homepage — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });
  }

  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user: User;

  protected readonly faClone = faClone;
  protected readonly faFolder = faFolder;
  protected readonly faPlus = faPlus;
  protected readonly faSync = faSync;
  protected readonly faWifi = faWifi;

  protected offlineSetIds: string[] = [];

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.myUser();
    if (user) {
      this.user = user;

      this.user.sets.forEach((s) => {
        s.updatedAt = new Date(s.updatedAt);
      });
      this.user.sets = this.user.sets.sort((a, b) => {
        return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
      });

      this.user.folders = this.user.folders
          .sort((a, b) => {
            return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
          })
          .filter((f) => !f.parentFolderId);

      const offlineSets = await this.offlineStorage.getAllStudySets();
      this.offlineSetIds = offlineSets.map(s => s.id);
    }

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
  }

  async refreshOfflineSet(event: Event, setId: string) {
    event.stopPropagation();
    const set = await this.setsService.set(setId);
    if (set) {
      await this.offlineStorage.saveStudySet(set);
      alert("Offline set refreshed successfully!");
    }
  }

  isSetOffline(setId: string): boolean {
    return this.offlineSetIds.includes(setId);
  }
}
