import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { DecodeComponent } from './app/decode/decode.component';
import { EncodeComponent } from './app/encode/encode.component';
import { InstructionsComponent } from './app/instructions/instructions.component';
import { provideRouter, Routes, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { provideZxvbnServiceForPSM } from 'angular-password-strength-meter/zxcvbn';
import { Location, LocationStrategy, HashLocationStrategy, CommonModule } from '@angular/common';

const routes: Routes = [
  { path: '', component: InstructionsComponent },
  {
    path: 'encode',
    component: EncodeComponent,
  },
  {
    path: 'decode',
    component: DecodeComponent,
  },
  {
    path: 'decode/:encoded',
    component: DecodeComponent,
  },
];

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      CommonModule,
      BrowserModule,
      MatToolbarModule,
      MatIconModule,
      MatButtonModule,
      MatCardModule,
      MatDividerModule,
      MatExpansionModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000',
      }),
      RouterOutlet,
      RouterLink,
      RouterLinkActive
    ),
    Location,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideZxvbnServiceForPSM(),
    provideRouter(routes),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
