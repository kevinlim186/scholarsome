import { Component, HostListener, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { SetsService } from "../../shared/http/sets.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Card } from "@prisma/client";
import { BsModalRef } from "ngx-bootstrap/modal";
import { faThumbsUp, faCake, faVolumeUp, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { DomSanitizer, Meta, Title } from "@angular/platform-browser";
import { NgForm } from "@angular/forms";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { EdgeTTSBrowser } from "edge-tts-universal";

@Component({
  selector: "scholarsome-study-set-flashcards",
  templateUrl: "./study-set-flashcards.component.html",
  styleUrls: ["./study-set-flashcards.component.scss"]
})
export class StudySetFlashcardsComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly sets: SetsService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    public readonly sanitizer: DomSanitizer
  ) {}

  @ViewChild("flashcardsConfig") configModal: TemplateRef<HTMLElement>;
  @ViewChild("completedRound") roundCompletedModal: TemplateRef<HTMLElement>;

  protected cards: Card[];
  protected setId: string | null;

  protected flashcardsMode: "traditional" | "progressive";
  protected shufflingEnabled = false;

  // Array of the IDs of known cards for progressive mode
  protected knownCardIDs: string[] = [];
  // Whether the user is between rounds
  protected roundCompleted = false;
  // Counter for number of cards learned in the current round
  protected newLearnedCards = 0;

  // What the user answers with
  protected answer: "definition" | "term";
  // The current index
  protected index = 0;
  // The current card
  protected currentCard: Card;

  // The current side being shown
  protected side: string;
  // The text being shown to the user
  protected sideText = "";
  // Displayed in bottom right showing the progress
  protected remainingCards = "";

  // Whether the card has been flipped or not
  protected flipped = false;
  // Whether the first flip interaction has been made
  // needed to prevent animation classes from being applied until first click
  protected flipInteraction = false;

  protected ttsEnabled = false;
  protected autoplayEnabled = false;
  protected termLanguage = "en-US";
  protected definitionLanguage = "de-DE";
  protected useEnhancedTTS = true;

  private currentAudio: HTMLAudioElement | null = null;

  protected modalRef?: BsModalRef;
  protected readonly faThumbsUp = faThumbsUp;
  protected readonly faCake = faCake;
  protected readonly faVolumeUp = faVolumeUp;
  protected readonly faPlay = faPlay;
  protected readonly faPause = faPause;
  protected readonly faQuestionCircle = faQuestionCircle;

  @HostListener("document:keypress", ["$event"])
  keyboardSpaceEvent(event: KeyboardEvent) {
    if (
      this.flashcardsMode &&
      !this.roundCompleted &&
      event.key === " "
    ) {
      this.flipCard();
    }
  }

  @HostListener("document:keyup", ["$event"])
  keyboardArrowEvent(event: KeyboardEvent) {
    if (
      this.flashcardsMode &&
      !this.roundCompleted
    ) {
      if (event.key === "ArrowLeft") {
        if (this.flashcardsMode === "traditional") {
          this.changeCard(-1);
        } else {
          this.changeCard(1);
        }
      } else if (event.key === "ArrowRight") {
        if (this.flashcardsMode === "traditional") {
          this.changeCard(1);
        } else {
          this.incrementLearntCount();
          this.knownCardIDs.push(this.currentCard.id);
          this.changeCard(1);
        }
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        this.flipCard();
      }
    }
  }

  updateIndex() {
    this.remainingCards = `${this.index + 1}/${this.cards.length}`;
  }

  incrementLearntCount(): void {
    this.newLearnedCards++;
  }

  flipCard(type?: string) {
    if (!type) {
      this.flipInteraction = true;
      this.flipped = !this.flipped;
    }

    // delayed to occur when text is the least visible during animation
    setTimeout(() => {
      if (this.side === "term") {
        this.sideText = this.cards[this.index].definition;
        this.side = "definition";
      } else {
        this.sideText = this.cards[this.index].term;
        this.side = "term";
      }

      if (this.autoplayEnabled) {
        this.speakCurrentSide();
      }
    }, 150);
  }

  changeCard(direction: number) {
    if (
      this.index === 0 &&
      direction === -1
    ) return;

    if (
      this.index === this.cards.length - 1 &&
      direction === 1 &&
      this.flashcardsMode === "traditional"
    ) return;

    // increment the currentCard object to the next card in the array
    if (this.flashcardsMode === "progressive" && this.index !== this.cards.length - 1) {
      this.currentCard = this.cards[this.index + 1];
    }

    // runs after a progressive mode round has completed
    if (this.index === this.cards.length - 1 && this.flashcardsMode === "progressive") {
      // remove any cards that are known
      this.cards = this.cards.filter((c) => !this.knownCardIDs.includes(c.id));

      this.roundCompleted = true;

      // if the entire mode is not completed
      if (this.cards.length > 0) {
        this.index = 0;
        this.updateIndex();

        if (this.shufflingEnabled) this.cards = this.cards.sort(() => 0.5 - Math.random());

        this.sideText = this.cards[0][this.side as keyof Card] as string;
      }

      this.flipped = false;
      this.flipInteraction = false;
      this.currentCard = this.cards[0];

      return;
    }

    this.index += direction;
    this.updateIndex();

    this.flipInteraction = false;
    this.flipped = false;

    if (this.answer === "definition") {
      this.side = "term";
    } else {
      this.side = "definition";
    }

    this.sideText =
      this.answer === "definition" ? this.cards[this.index].term : this.cards[this.index].definition;

    if (this.autoplayEnabled) {
      this.speakCurrentSide();
    }
  }

  beginFlashcards(form: NgForm) {
    this.flashcardsMode = form.value["flashcards-type"];
    this.answer = form.value["answer-with"];
    this.side = form.value["answer-with"] === "definition" ? "term" : "definition";

    if (form.value["enable-shuffling"] === "yes") {
      this.cards = this.cards.sort(() => 0.5 - Math.random());
      this.shufflingEnabled = true;
    }

    this.ttsEnabled = form.value["enable-tts"] === "yes";
    this.autoplayEnabled = form.value["enable-autoplay"] === "yes";
    this.termLanguage = form.value["term-lang"];
    this.definitionLanguage = form.value["definition-lang"];
    this.useEnhancedTTS = form.value["enhanced-tts"] === "yes";

    this.sideText = this.cards[0][this.side as keyof Card] as string;
    this.currentCard = this.cards[0];

    if (this.autoplayEnabled) {
      this.speakCurrentSide();
    }
  }

  speakCurrentSide() {
    if (!this.ttsEnabled) return;
    const lang = this.side === "term" ? this.termLanguage : this.definitionLanguage;
    this.speak(this.stripHtml(this.sideText), lang);
  }

  stripHtml(html: string): string {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  async speak(text: string, lang: string) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    if (this.useEnhancedTTS) {
      try {
        const voiceMap: { [key: string]: string } = {
          "en-US": "en-US-AndrewNeural",
          "de-DE": "de-DE-KillianNeural",
          "es-ES": "es-ES-AlvaroNeural",
          "fr-FR": "fr-FR-RemyNeural"
        };

        const voice = voiceMap[lang] || voiceMap["en-US"];
        const tts = new EdgeTTSBrowser(text, voice);
        const result = await tts.synthesize();
        const url = URL.createObjectURL(result.audio);

        this.currentAudio = new Audio(url);
        await this.currentAudio.play();
        return;
      } catch (e) {
        console.error("Enhanced TTS failed, falling back to system TTS", e);
      }
    }

    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Try to find a high-quality voice for the language
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(lang.split("-")[0]) && (v.name.includes("Siri") || v.name.includes("Premium") || v.name.includes("Enhanced")));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
      const standardVoice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
      if (standardVoice) {
        utterance.voice = standardVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  toggleAutoplay() {
    this.autoplayEnabled = !this.autoplayEnabled;
  }

  reloadPage() {
    this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
      this.router.navigate(["/study-set/" + this.setId + "/flashcards"]);
    });
  }

  async ngOnInit(): Promise<void> {
    this.setId = this.route.snapshot.paramMap.get("setId");
    if (!this.setId) {
      await this.router.navigate(["404"]);
      return;
    }

    const set = await this.sets.set(this.setId);
    if (!set) {
      await this.router.navigate(["404"]);
      return;
    }

    this.titleService.setTitle(set.title + " — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Begin studying flashcards " + set.title + " study set on Scholarsome. Improve your memorization skills by taking a quiz." });

    // sort the cards by index
    this.cards = set.cards.sort((a, b) => {
      return a.index - b.index;
    });

    this.updateIndex();
  }
}
