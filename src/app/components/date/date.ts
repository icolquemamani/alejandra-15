import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Input, ChangeDetectorRef, ElementRef, ViewChild, PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-date',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date.html',
  styleUrl: './date.scss'
})
export class DateComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() eventDate: Date = new Date('2026-06-20T19:00:00');

  @ViewChild('card0') card0!: ElementRef<HTMLImageElement>;
  @ViewChild('card1') card1!: ElementRef<HTMLImageElement>;
  @ViewChild('card2') card2!: ElementRef<HTMLImageElement>;
  @ViewChild('card3') card3!: ElementRef<HTMLImageElement>;
  @ViewChild('dateSection') dateSection!: ElementRef<HTMLElement>;

  countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' };
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private gsapContext: gsap.Context | null = null;
  private observer: IntersectionObserver | null = null;
  private scrollerEl: Element | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Dar un tick para que el DOM esté completamente listo antes de buscar el scroll container
    setTimeout(() => {
      const section = this.dateSection.nativeElement;

      // Resolver el scroll container recorriendo el DOM hacia arriba
      this.scrollerEl = this.findScrollContainer(section);

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Diferir un tick para que GSAP inicialice su caché interno (_gsap)
            setTimeout(() => {
              this.initAnimations();
              setTimeout(() => ScrollTrigger.refresh(), 150);
            }, 0);

            this.observer?.disconnect();
          }
        });
      }, {
        root: this.scrollerEl,  // elemento DOM real, no selector
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.05
      });

      this.observer.observe(section);
    }, 0);
  }

  /** Recorre el DOM hacia arriba para encontrar el primer ancestro scrollable */
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

  private initAnimations() {
    const section = this.dateSection.nativeElement;
    const cards = [this.card0, this.card1, this.card2, this.card3];

    this.gsapContext = gsap.context(() => {

      // ── CARTAS: entrada desde los bordes, salida hacia los bordes ─────────
      const cardDefs = [
        { ref: this.card0, fromX: '-120vw', fromY: '-60vh', fromRot: -270 },
        { ref: this.card1, fromX:  '120vw', fromY: '-80vh', fromRot:  270 },
        { ref: this.card2, fromX: '-100vw', fromY:  '80vh', fromRot:  200 },
        { ref: this.card3, fromX:  '100vw', fromY:  '60vh', fromRot: -200 },
      ];

      cardDefs.forEach(({ ref, fromX, fromY, fromRot }) => {
        const el = ref?.nativeElement;
        if (!el) return;

        // Estado inicial: fuera de pantalla
        gsap.set(el, { x: fromX, y: fromY, rotation: fromRot, opacity: 0 });

        // Pequeño defer para que _gsap cache esté disponible antes de ScrollTrigger
        setTimeout(() => {
          gsap.to(el, {
            x: 0, y: 0, rotation: 0, opacity: 0.85,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              scroller: this.scrollerEl || window,  // elemento DOM, no selector
              start: 'top bottom',
              end: 'bottom top',
              toggleActions: 'play reverse play reverse',
            }
          });
        }, 0);
      });

      const scroller = this.scrollerEl || window;

      // ── SEPARADOR SUPERIOR: cae desde arriba ─────────────────────────────
      gsap.from('.date-ornament', {
        y: -80, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: section, scroller, start: 'top bottom', end: 'bottom top', toggleActions: 'play reverse play reverse' }
      });

      // ── FECHA: cascada weekday → day (elástico) → month ──────────────────
      const dateTl = gsap.timeline({
        scrollTrigger: { trigger: '.date-badge', scroller, start: 'top bottom', end: 'bottom top', toggleActions: 'play reverse play reverse' }
      });

      dateTl
        .from('.date-weekday', { y: 40, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' })
        .from('.date-day',     { scale: 0.3, opacity: 0, duration: 1, ease: 'elastic.out(1, 0.45)' }, '-=0.2')
        .from('.date-month',   { y: 40, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.5');

      // ── SEPARADOR INFERIOR: se expande desde el centro ───────────────────
      gsap.from('.separator-line', {
        scaleX: 0, opacity: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: '.separator-line', scroller, start: 'top bottom', end: 'bottom top', toggleActions: 'play reverse play reverse' }
      });

      // ── COUNTDOWN UNITS: suben en cascada ────────────────────────────────
      gsap.from('.count-unit', {
        y: 60, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.13,
        scrollTrigger: { trigger: '.countdown-wrapper', scroller, start: 'top bottom', end: 'bottom top', toggleActions: 'play reverse play reverse' }
      });

      // ── TEXTO INFERIOR: sube con delay ───────────────────────────────────
      gsap.from('.countdown-label-top', {
        y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.6,
        scrollTrigger: { trigger: '.countdown-wrapper', scroller, start: 'top bottom', end: 'bottom top', toggleActions: 'play reverse play reverse' }
      });

    }, section);
  }

  ngOnDestroy() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.observer?.disconnect();
    this.gsapContext?.revert();
  }

  updateCountdown() {
    const now = new Date().getTime();
    const distance = this.eventDate.getTime() - now;

    if (distance <= 0) {
      this.countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' };
      return;
    }

    const days    = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown = {
      days:    String(days).padStart(2, '0'),
      hours:   String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }
}
