import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DecodeComponent } from './decode/decode.component';
import { InstructionsComponent } from './instructions/instructions.component';

const routes: Routes = [
  { path: '', component: InstructionsComponent },
  {
    path: 'encode',
    loadChildren: () =>
      import('./encode/encode.module').then((m) => m.AppEncodeModule),
  },
  {
    path: 'decode',
    loadChildren: () =>
      import('./decode/decode.module').then((m) => m.AppDecodeModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
