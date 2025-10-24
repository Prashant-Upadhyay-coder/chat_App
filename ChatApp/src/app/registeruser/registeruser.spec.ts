import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Registeruser } from './registeruser';

describe('Registeruser', () => {
  let component: Registeruser;
  let fixture: ComponentFixture<Registeruser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registeruser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Registeruser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
