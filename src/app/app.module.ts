import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, HashLocationStrategy, Location, LocationStrategy } from '@angular/common';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { AppComponent } from './app.component';

import { InstructionsComponent } from './instructions/instructions.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { provideZxvbnServiceForPSM } from 'angular-password-strength-meter/zxcvbn';
import { provideRouter, RouterLink, RouterLinkActive, RouterOutlet, Routes } from '@angular/router';
import { EncodeComponent } from './encode/encode.component';
import { DecodeComponent } from './decode/decode.component';

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

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
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
    RouterLinkActive,
    // AppEncodeModule,
    // AppDecodeModule,
  ],
  providers: [
    Location,
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideZxvbnServiceForPSM(),
    provideRouter(routes),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
