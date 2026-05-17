import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { EventMy } from './event-my';

describe('EventMy', () => {
  let component: EventMy;
  let fixture: ComponentFixture<EventMy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventMy],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventMy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
