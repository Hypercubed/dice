import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncodeComponent } from './encode.component';

import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('EncodeComponent', () => {
  let component: EncodeComponent;
  let fixture: ComponentFixture<EncodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      declarations: [ EncodeComponent ]
    })
    .compileComponents();
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
