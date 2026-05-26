import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './music-player.html',
  styleUrl: './music-player.scss'
})
export class MusicPlayerComponent implements OnChanges {
  @Input() isVisible = false;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  isPlaying = false;
  private hasStarted = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible']?.currentValue === true && !this.hasStarted) {
      this.playWhenReady();
    }
  }

  private playWhenReady() {
    // Check if element is available, if not, wait a bit
    if (this.audioPlayer && this.audioPlayer.nativeElement) {
      this.audioPlayer.nativeElement.play()
        .then(() => {
          this.isPlaying = true;
          this.hasStarted = true;
        })
        .catch(err => {
          console.warn('Autoplay prevented. Waiting for user interaction.', err);
        });
    } else {
      // Re-try once after a short delay if ViewChild isn't ready yet
      setTimeout(() => this.playWhenReady(), 100);
    }
  }



  toggleMusic() {
    const audio = this.audioPlayer.nativeElement;
    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
    } else {
      audio.pause();
      this.isPlaying = false;
    }
  }
}
