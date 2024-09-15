import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  standalone: true,
  selector: 'app-instructions',
  templateUrl: './instructions.component.html',
  styleUrls: ['./instructions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatExpansionModule],
})
export class InstructionsComponent {}
