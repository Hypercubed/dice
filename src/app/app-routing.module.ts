import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DecodeComponent } from './decode/decode.component';
import { EncodeComponent } from './encode/encode.component';
import { InstructionsComponent } from './instructions/instructions.component';

const routes: Routes = [
  { path: '', component: InstructionsComponent },
  { path: 'encode', component: EncodeComponent },
  { path: 'decode', component: DecodeComponent },
  { path: 'decode/:encoded', component: DecodeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
