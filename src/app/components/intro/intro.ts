import { Component, ElementRef, AfterViewInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.html',
  styleUrl: './intro.scss'
})
export class IntroComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  isVisible = false;
  isScrollReady = false;

  private cards: HTMLElement[] = [];
  private scrollListener?: () => void;
  private scrollerEl: Element | null = null;

  // LERP momentum scroll
  private targetProgress = 0.4;
  private currentProgress = 0.4;
  private animationFrameId?: number;
  private isAnimating = false;

  // Flutter (revolotear) state
  private flutterIntensity = 0;       // Current flutter amplitude (decays over time)
  private lastScrollPos = 0;          // Last known scroll position for velocity calc
  private flutterTime = 0;            // Internal clock for oscillation
  private readonly FLUTTER_DECAY = 0.88;  // How fast flutter fades (per frame, < 1 = faster decay)
  private readonly FLUTTER_SPEED = 0.18; // Oscillation speed (rad/frame)

  // Per-card flutter parameters: [rotAmplitude, yAmplitude, xAmplitude, phaseOffset]
  private readonly CARD_FLUTTER = [
    { rotAmp: 1.0, yAmp: 3.5, xAmp: 2.2, phase: 0.0 },
    { rotAmp: 0.6, yAmp: 2.5, xAmp: 1.4, phase: Math.PI * 0.55 },
    { rotAmp: 0.6, yAmp: 2.5, xAmp: 1.4, phase: Math.PI * 1.1 },
    { rotAmp: 1.0, yAmp: 3.5, xAmp: 2.2, phase: Math.PI * 1.65 },
  ];

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    // Wait one tick for DOM to be fully ready before traversing ancestors
    setTimeout(() => {
      const section = this.el.nativeElement as HTMLElement;

      // Find the real scrollable ancestor (same pattern as date component)
      this.scrollerEl = this.findScrollContainer(section);

      const scrollTarget = this.scrollerEl ?? window;
      this.lastScrollPos = this.scrollerEl ? this.scrollerEl.scrollTop : window.scrollY;

      // 1. Setup IntersectionObserver — use scrollerEl as root if available
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.triggerEntrance();
              observer.disconnect();
            }
          });
        }, {
          root: this.scrollerEl,   // real DOM element, not a selector
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });
        observer.observe(section);
      } else {
        this.triggerEntrance();
      }

      // 2. Setup scroll listener on the real scroll container
      this.scrollListener = () => this.onScroll();
      scrollTarget.addEventListener('scroll', this.scrollListener, { passive: true });

      // Trigger initial parallax calc
      this.updateScrollParallax();
    }, 0);
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      const scrollTarget = this.scrollerEl ?? window;
      scrollTarget.removeEventListener('scroll', this.scrollListener);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /** Traverse DOM upward to find the first scrollable ancestor */
  private findScrollContainer(from: Element): Element | null {
    let el: Element | null = from.parentElement;
    while (el) {
      const style = window.getComputedStyle(el);
      const oy = style.overflowY;
      if (oy === 'auto' || oy === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }

  private triggerEntrance() {
    this.isVisible = true;
    this.cdr.detectChanges();

    // Cache card HTML elements
    this.cards = Array.from(this.el.nativeElement.querySelectorAll('.card-wrapper'));

    // After entrance animation completes, switch to JS-driven parallax + flutter
    setTimeout(() => {
      this.isScrollReady = true;
      this.cdr.detectChanges();
      this.applyCardStyles(this.currentProgress);
      this.startLoop();
    }, 3500);
  }

  // Called on every scroll event from the real scroll container
  private onScroll() {
    // --- Flutter injection ---
    const currentPos = this.scrollerEl ? this.scrollerEl.scrollTop : window.scrollY;
    const scrollDelta = Math.abs(currentPos - this.lastScrollPos);
    this.lastScrollPos = currentPos;

    // Scale scroll speed to flutter intensity (clamp to max 1)
    const velocityContribution = Math.min(scrollDelta * 0.07, 1.0);
    this.flutterIntensity = Math.min(this.flutterIntensity + velocityContribution, 1.0);

    // --- Parallax update ---
    this.updateScrollParallax();
  }

  private updateScrollParallax() {
    const section = this.el.nativeElement as HTMLElement;
    const rect = section.getBoundingClientRect();

    // Use the scroll container's height as the "viewport" for progress calc
    const viewportHeight = this.scrollerEl
      ? this.scrollerEl.clientHeight
      : window.innerHeight;

    if (rect.top < viewportHeight && rect.bottom > 0) {
      const totalArea = viewportHeight + rect.height;
      const progress = (viewportHeight - rect.top) / totalArea;
      this.targetProgress = Math.max(0, Math.min(1, progress));

      if (!this.isAnimating) {
        this.isAnimating = true;
        this.animate();
      }
    }
  }

  /** Start the rAF loop so flutter can decay even when scroll stops */
  private startLoop() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  private animate() {
    // Always advance flutter clock
    this.flutterTime += this.FLUTTER_SPEED;
    // Decay flutter intensity each frame
    this.flutterIntensity *= this.FLUTTER_DECAY;

    // LERP toward target progress
    const diff = this.targetProgress - this.currentProgress;
    if (Math.abs(diff) > 0.0001) {
      this.currentProgress += diff * 0.07;
    } else {
      this.currentProgress = this.targetProgress;
    }

    this.applyCardStyles(this.currentProgress);

    // Keep loop alive while flutter is visible OR LERP still moving
    const hasFlutter = this.flutterIntensity > 0.002;
    const hasLerp = Math.abs(this.targetProgress - this.currentProgress) > 0.0001;

    if (hasFlutter || hasLerp) {
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      this.isAnimating = false;
    }
  }

  private applyCardStyles(progress: number) {
    if (!this.isScrollReady || this.cards.length === 0) return;

    const delta = progress - 0.4;

    // Base parallax movement
    const yOffset = delta * -240;
    const rotateMultiplier = delta * 28;
    const xMultiplier = delta * 38;

    // Base fan configuration per card
    const configs = [
      { baseTranslateX: -15, baseTranslateY: 15, baseRotate: -14, xFactor: -1, rFactor: -1 },
      { baseTranslateX: -5,  baseTranslateY: 0,  baseRotate: -5,  xFactor: -0.4, rFactor: -0.4 },
      { baseTranslateX: 5,   baseTranslateY: 0,  baseRotate: 5,   xFactor: 0.4, rFactor: 0.4 },
      { baseTranslateX: 15,  baseTranslateY: 15, baseRotate: 14,  xFactor: 1, rFactor: 1 },
    ];

    const intensity = this.flutterIntensity;
    const t = this.flutterTime;

    configs.forEach((config, index) => {
      const card = this.cards[index];
      if (!card) return;

      const flutter = this.CARD_FLUTTER[index];

      // Parallax base
      const baseTx = config.baseTranslateX + xMultiplier * config.xFactor;
      const baseTy = config.baseTranslateY + yOffset;
      const baseRot = config.baseRotate + rotateMultiplier * config.rFactor;

      // Flutter offsets — sine waves with unique phase per card
      // Two overlapping frequencies for organic feel
      const wave1 = Math.sin(t + flutter.phase);
      const wave2 = Math.sin(t * 1.7 + flutter.phase + 0.9) * 0.45;
      const wave = wave1 + wave2;

      const flutterRot = wave * flutter.rotAmp * intensity * 9;   // max ~±9deg at full intensity
      const flutterY   = wave * flutter.yAmp  * intensity;         // max ~±3.5px
      const flutterX   = Math.sin(t * 1.3 + flutter.phase + 0.4) * flutter.xAmp * intensity;

      const tx  = baseTx + flutterX;
      const ty  = baseTy + flutterY;
      const rot = baseRot + flutterRot;

      card.style.transform = `translateY(${ty.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) translateX(${tx.toFixed(2)}px)`;
    });
  }
}
