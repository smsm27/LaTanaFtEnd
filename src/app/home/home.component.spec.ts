import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaTanaDelNerdComponent } from './home.component';

describe('LaTanaDelNerdComponent', () => {
  let component: LaTanaDelNerdComponent;
  let fixture: ComponentFixture<LaTanaDelNerdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaTanaDelNerdComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaTanaDelNerdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
