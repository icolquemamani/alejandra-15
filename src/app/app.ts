import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoverComponent } from './components/cover/cover';
import { MusicPlayerComponent } from './components/music-player/music-player';
import { SparklesComponent } from './components/sparkles/sparkles';
import { IntroComponent } from './components/intro/intro';
import { FamilyComponent } from './components/family/family';
import { DateComponent } from './components/date/date';
import { PhotoComponent } from './components/photo/photo';
import { EventComponent } from './components/event/event';
import { GiftsComponent } from './components/gifts/gifts';
import { RsvpComponent } from './components/rsvp/rsvp';
import { GalleryComponent } from './components/gallery/gallery';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    CoverComponent,
    MusicPlayerComponent,
    SparklesComponent,
    IntroComponent,
    FamilyComponent,
    DateComponent,
    PhotoComponent,
    EventComponent,
    GiftsComponent,
    RsvpComponent,
    // GalleryComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  isCoverVisible = true;


  enterInvitation() {
    this.isCoverVisible = false;
    this.toggleFullScreen();
  }

  private toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen =
      docEl.requestFullscreen ||
      (docEl as any).mozRequestFullScreen ||
      (docEl as any).webkitRequestFullscreen ||
      (docEl as any).msRequestFullscreen;

    if (requestFullScreen) {
      requestFullScreen.call(docEl);
    }
  }
}
