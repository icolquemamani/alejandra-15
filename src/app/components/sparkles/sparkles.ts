import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sparkle {
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  opacity: number;
}

@Component({
  selector: 'app-sparkles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkles.html',
  styleUrl: './sparkles.scss'
})
export class SparklesComponent implements OnInit {
  sparkles: Sparkle[] = [];
  readonly SPARKLE_COUNT = 80;

  ngOnInit() {
    this.generateSparkles();
  }

  private generateSparkles() {
    for (let i = 0; i < this.SPARKLE_COUNT; i++) {
      this.sparkles.push({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 10 + 6}px`, // Size between 4px and 12px
        duration: `${Math.random() * 6 + 4}s`, // Duration between 4s and 10s
        delay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.4 + 0.5 // Opacity between 0.5 and 0.9
      });
    }
  }
}
