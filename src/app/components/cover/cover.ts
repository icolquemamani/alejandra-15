import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cover.html',
  styleUrl: './cover.scss'
})
export class CoverComponent implements OnInit {
  @Output() onEnter = new EventEmitter<void>();

  fireflies: any[] = [];

  ngOnInit() {
    this.fireflies = Array.from({ length: 25 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 20 + 8}px`,
      duration: `${Math.random() * 4 + 4}s`,
      delay: `${Math.random() * 6}s`,
      dx: `${Math.random() * 160 - 80}px`,
      dy: `${Math.random() * 160 - 80}px`,
    }));
  }

  enter() {
    this.onEnter.emit();
  }
}
