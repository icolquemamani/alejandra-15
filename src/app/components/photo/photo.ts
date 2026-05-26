import {
  Component, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, NgZone, PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-photo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo.html',
  styleUrl: './photo.scss'
})
export class PhotoComponent implements AfterViewInit, OnDestroy {

  @ViewChild('photoSection')       photoSection!:       ElementRef<HTMLElement>;
  @ViewChild('topBorder')          topBorder!:          ElementRef<HTMLElement>;
  @ViewChild('extraDecor')         extraDecor!:         ElementRef<HTMLElement>;
  @ViewChild('mainPhotoContainer') mainPhotoContainer!: ElementRef<HTMLElement>;

  // Imagen principal — parallax directo con RAF (sin GSAP para evitar conflictos)
  @ViewChild('mainPhoto') mainPhoto!: ElementRef<HTMLImageElement>;

  // Gato — rotación con scroll, sin GSAP
  @ViewChild('gatoImg') gatoImgRef!: ElementRef<HTMLImageElement>;

  private scrollContainer: Element | null = null;
  private boundOnScroll = this.onScroll.bind(this);
  private rafId: number | null = null;
  private pendingScrollTop = 0;
  private gsapContext: gsap.Context | null = null;
  private observer: IntersectionObserver | null = null;

  // ── Vibración de la foto ──────────────────────────────────────────────────
  private shakeIntensity  = 0;    // amplitud actual del shake (px)
  private lastScrollTime  = 0;    // timestamp del último evento scroll
  private shakeRafId: number | null = null;
  private shakeRunning    = false;

  constructor(
    private elRef: ElementRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const section = this.photoSection.nativeElement;

      // Resolver el scroll container recorriendo el DOM hacia arriba
      this.scrollContainer = this.findScrollContainer(section);

      // ── Gato: rotación con scroll (fuera de zona Angular) ─────────────────
      this.ngZone.runOutsideAngular(() => {
        const target = this.scrollContainer ?? window;
        target.addEventListener('scroll', this.boundOnScroll, { passive: true });
      });

      // ── GSAP: esperar a que la sección sea visible (IntersectionObserver) ──
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              this.initAnimations();
              setTimeout(() => ScrollTrigger.refresh(), 150);
            }, 0);
            this.observer?.disconnect();
          }
        });
      }, {
        root: this.scrollContainer,  // elemento DOM real, no selector
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.05
      });

      this.observer.observe(section);
    }, 0);
  }

  ngOnDestroy() {
    if (this.rafId     !== null) cancelAnimationFrame(this.rafId);
    if (this.shakeRafId !== null) cancelAnimationFrame(this.shakeRafId);
    const target = this.scrollContainer ?? window;
    target.removeEventListener('scroll', this.boundOnScroll);
    this.observer?.disconnect();
    this.gsapContext?.revert();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Animaciones GSAP
  // ───────────────────────────────────────────────────────────────────────────
  private initAnimations() {
    const section  = this.photoSection.nativeElement;
    const scroller = this.scrollContainer || window;

    // ── Detectar si la sección ya es visible (caso hero / primera sección) ──
    const scrollerBottom = this.scrollContainer
      ? this.scrollContainer.getBoundingClientRect().bottom
      : window.innerHeight;
    const sectionRect    = section.getBoundingClientRect();
    const alreadyVisible = sectionRect.top < scrollerBottom && sectionRect.bottom > 0;

    this.gsapContext = gsap.context(() => {

      if (alreadyVisible) {
        // ── SECCIÓN YA VISIBLE: timeline directo, sin ScrollTrigger ──────────
        // Los elementos aparecen en cascada para que el usuario los vea
        const tl = gsap.timeline({ delay: 0.15 });

        tl.from(this.topBorder.nativeElement, {
            y: -80, opacity: 0, duration: 0.9, ease: 'power3.out',
          })
          .from(this.mainPhotoContainer.nativeElement, {
            y: 70, opacity: 0, scale: 0.88, duration: 1.1, ease: 'power3.out',
          }, '-=0.5')
          .from(this.extraDecor.nativeElement, {
            y: -50, opacity: 0, rotation: -20, duration: 0.9, ease: 'back.out(1.5)',
          }, '-=0.7')
          .from(section.querySelectorAll('.sparkle'), {
            scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.1,
          }, '-=0.5');

      } else {
        // ── SECCIÓN FUERA DE VISTA: ScrollTrigger play/reverse ───────────────
        const st = (trigger: Element) => ({
          trigger,
          scroller,
          start: 'top bottom',
          end:   'bottom top',
          toggleActions: 'play reverse play reverse',
        });

        gsap.from(this.topBorder.nativeElement, {
          y: -80, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: st(section),
        });

        gsap.from(this.mainPhotoContainer.nativeElement, {
          y: 70, opacity: 0, scale: 0.88, duration: 1.1, ease: 'power3.out',
          scrollTrigger: st(section),
        });

        setTimeout(() => {
          gsap.from(this.extraDecor.nativeElement, {
            y: -50, opacity: 0, rotation: -20, duration: 0.9, ease: 'back.out(1.5)',
            scrollTrigger: st(section),
          });
        }, 0);

        gsap.from(section.querySelectorAll('.sparkle'), {
          scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.1,
          scrollTrigger: st(section),
        });
      }

    }, section);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Efectos de scroll con RAF (fuera de zona Angular, sin GSAP)
  // ───────────────────────────────────────────────────────────────────────────
  private onScroll() {
    // Gato: rotación
    this.pendingScrollTop = this.scrollContainer
      ? (this.scrollContainer as Element).scrollTop
      : window.scrollY;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const gatoEl = this.gatoImgRef?.nativeElement;
      if (gatoEl) {
        gatoEl.style.transform = `translateX(-50%) rotate(${this.pendingScrollTop}deg)`;
      }
      this.rafId = null;
    });

    // Foto: aumentar intensidad del shake y arrancar el loop si no está corriendo
    this.shakeIntensity = Math.min(3.5, this.shakeIntensity + 1.2);
    this.lastScrollTime = Date.now();

    if (!this.shakeRunning) {
      this.shakeRunning = true;
      this.runShakeLoop();
    }
  }

  /** Loop RAF autosostenido: oscila la foto y decae al parar el scroll */
  private runShakeLoop() {
    const photoEl = this.mainPhoto?.nativeElement;
    if (!photoEl) { this.shakeRunning = false; return; }

    const elapsed = Date.now() - this.lastScrollTime;

    // Decaer intensidad si el usuario dejó de scrollear
    if (elapsed > 60) {
      this.shakeIntensity *= 0.82;
    }

    if (this.shakeIntensity < 0.04) {
      // Vibración terminada: limpiar transform y detener loop
      photoEl.style.transform = '';
      this.shakeRunning = false;
      return;
    }

    // Oscilación multi-frecuencia para aspecto orgánico
    const t   = Date.now() * 0.024;
    const x   = Math.sin(t * 2.1) * this.shakeIntensity;
    const y   = Math.cos(t * 1.6) * this.shakeIntensity * 0.45;
    const rot = Math.sin(t * 1.3) * this.shakeIntensity * 0.25;

    photoEl.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;

    this.shakeRafId = requestAnimationFrame(() => this.runShakeLoop());
  }

  /** Recorre el DOM hacia arriba para encontrar el primer ancestro scrollable */
  private findScrollContainer(from: Element): Element | null {
    let el: Element | null = from.parentElement;
    while (el) {
      const oy = window.getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }
}
