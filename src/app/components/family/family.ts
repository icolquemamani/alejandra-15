import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family.html',
  styleUrl: './family.scss'
})
export class FamilyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hourHand', { static: false }) hourHand!: ElementRef<HTMLImageElement>;
  @ViewChild('minuteHand', { static: false }) minuteHand!: ElementRef<HTMLImageElement>;

  private animFrameId: number | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    // Ejecutamos la animación 100% fuera de la zona de Angular
    // y manipulamos directamente el DOM para evitar cualquier problema
    // de Change Detection o retrasos del ciclo de renderizado.
    this.ngZone.runOutsideAngular(() => {
      const tick = () => {
        const now = new Date();
        const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
        const minutes = now.getMinutes() + seconds / 60;
        const hours   = (now.getHours() % 12) + minutes / 60;

        const minuteRotation = minutes * 6  * 100;   // velocidad x3
        const hourRotation   = hours   * 30 * 100;   // velocidad x3

        if (this.hourHand && this.hourHand.nativeElement) {
          this.hourHand.nativeElement.style.transform = `translateZ(0) rotate(${hourRotation}deg)`;
        }
        if (this.minuteHand && this.minuteHand.nativeElement) {
          this.minuteHand.nativeElement.style.transform = `translateZ(0) rotate(${minuteRotation}deg)`;
        }

        this.animFrameId = requestAnimationFrame(tick);
      };

      this.animFrameId = requestAnimationFrame(tick);
    });
  }

  ngOnDestroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
