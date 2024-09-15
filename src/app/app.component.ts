import { CommonModule } from '@angular/common';
import { Component, Renderer2, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // imports: [
  //   CommonModule,
  //   MatToolbarModule,
  //   MatIconModule,
  //   MatButtonModule,
  //   RouterOutlet,
  //   RouterLink,
  //   RouterLinkActive,
  // ]
})
export class AppComponent {
  previousUrl = '';

  constructor(private renderer: Renderer2, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.previousUrl) {
          this.renderer.removeClass(document.body, this.previousUrl);
        }
        let currentUrlSlug = event.url.slice(1);
        if (currentUrlSlug) {
          this.renderer.addClass(document.body, currentUrlSlug);
        }
        this.previousUrl = currentUrlSlug;
      }
    });
  }
}
