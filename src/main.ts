import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { InstructionsComponent } from './app/instructions/instructions.component';
import { provideRouter, Routes } from '@angular/router';
import { provideZxvbnServiceForPSM } from 'angular-password-strength-meter/zxcvbn';
import { Location, LocationStrategy, HashLocationStrategy, CommonModule } from '@angular/common';

const routes: Routes = [
  { path: '', component: InstructionsComponent },
  {
    path: 'encode',
    loadComponent: () => import('./app/encode/encode.component').then((m) => m.EncodeComponent),
  },
  {
    path: 'decode',
    loadComponent: () => import('./app/decode/decode.component').then((m) => m.DecodeComponent),
  },
  {
    path: 'decode/:encoded',
    loadComponent: () => import('./app/decode/decode.component').then((m) => m.DecodeComponent),
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
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000',
      })
    ),
    Location,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideZxvbnServiceForPSM(),
    provideRouter(routes),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
