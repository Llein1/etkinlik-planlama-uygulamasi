import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { EventUpdate } from './event-update';

describe('EventUpdate', () => {
	let component: EventUpdate;
	let fixture: ComponentFixture<EventUpdate>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [EventUpdate],
			providers: [provideHttpClient(), provideRouter([{ path: 'event/update/:id', component: EventUpdate }])],
		}).compileComponents();

		fixture = TestBed.createComponent(EventUpdate);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});