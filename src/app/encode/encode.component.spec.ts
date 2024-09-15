import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { IPasswordStrengthMeterService } from 'angular-password-strength-meter';

import { EncodeComponent } from './encode.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('EncodeComponent', () => {
  let component: EncodeComponent;
  let fixture: ComponentFixture<EncodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, EncodeComponent],
      providers: [IPasswordStrengthMeterService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EncodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
