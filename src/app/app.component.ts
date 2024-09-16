import { Component, inject, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { MatIconAnchor, MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [MatToolbar, MatIconAnchor, RouterLink, MatIcon, MatAnchor, RouterLinkActive, RouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  private previousUrl = '';

  ngOnInit() {
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
