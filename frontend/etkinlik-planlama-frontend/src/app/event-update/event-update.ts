import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { IEventDetail } from '../../models/IEvents';
import { EVENT_CATEGORY_OPTIONS, OTHER_CATEGORY_OPTION, resolveCategoryValue, splitCategoryValue } from '../shared/category-options';
import { apiUrl } from '../shared/api-url';
import { NotificationService } from '../shared/notification.service';

@Component({
	selector: 'app-event-update',
	imports: [ReactiveFormsModule, CommonModule, RouterModule],
	templateUrl: './event-update.html',
	styleUrl: './event-update.css',
})
export class EventUpdate {
	private http = inject(HttpClient);
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private notificationService = inject(NotificationService);

	eventForm: FormGroup;
	submitting = false;
	loading = true;
	eventId: number | null = null;
	categories = EVENT_CATEGORY_OPTIONS;
	private originalFormSnapshot: Record<string, string> | null = null;

	constructor(private formBuilder: FormBuilder) {
		this.eventForm = this.formBuilder.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			date: ['', [Validators.required]],
			time: ['', [Validators.required]],
			location: ['', [Validators.required, Validators.minLength(2)]],
			category: ['', [Validators.required]],
			customCategory: [''],
			description: ['', [Validators.required, Validators.minLength(10)]],
		});

		this.syncCustomCategoryRules();
	}

	get isCustomCategorySelected() {
		return this.eventForm.get('category')?.value === OTHER_CATEGORY_OPTION;
	}

	private syncCustomCategoryRules() {
		const categoryControl = this.eventForm.get('category');
		const customCategoryControl = this.eventForm.get('customCategory');

		categoryControl?.valueChanges.subscribe((value) => {
			if (value === OTHER_CATEGORY_OPTION) {
				customCategoryControl?.setValidators([Validators.required, Validators.minLength(3)]);
			} else {
				customCategoryControl?.clearValidators();
				customCategoryControl?.setValue('', { emitEvent: false });
			}

			customCategoryControl?.updateValueAndValidity({ emitEvent: false });
		});
	}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			const id = Number(params['id']);

			if (!Number.isFinite(id)) {
				this.notificationService.error('Geçersiz etkinlik bilgisi.');
				this.router.navigate(['/event-my']);
				return;
			}

			this.eventId = id;
			const needsBackendData = this.prefillFromState();
			this.loadEvent(id, needsBackendData);
		});
	}

	private prefillFromState() {
		const eventState = history.state?.event as Partial<IEventDetail> | undefined;

		if (!eventState) {
			return true;
		}

		const snapshot = {
			title: eventState.title ?? '',
			date: eventState.date ?? '',
			time: this.normalizeTimeForInput(eventState.time ?? ''),
			location: eventState.location ?? '',
			...splitCategoryValue(eventState.category ?? ''),
			description: eventState.description ?? '',
		};

		this.originalFormSnapshot = snapshot;
		this.eventForm.patchValue(snapshot);

		return !Boolean(eventState.description);
	}

	private loadEvent(id: number, shouldBlockUi: boolean) {
		this.loading = shouldBlockUi;

		if (!shouldBlockUi) {
			return;
		}

		this.http
			.get<IEventDetail>(apiUrl(`/event/detail/${id}`), { withCredentials: true })
			.pipe(timeout({ first: 10000 }))
			.subscribe({
			next: (response) => {
				const snapshot = {
					title: response.title,
					date: response.date,
					time: this.normalizeTimeForInput(response.time),
					location: response.location,
					...splitCategoryValue(response.category),
					description: response.description,
				};

				this.originalFormSnapshot = snapshot;
				this.eventForm.patchValue(snapshot);
				this.loading = false;
			},
			error: (error) => {
				this.loading = false;
					this.notificationService.error('Etkinlik bilgileri alınamadı: ' + (error.error?.message || 'Bilinmeyen hata'));
			},
			});
	}

	private normalizeTimeForInput(value: string) {
		if (!value) {
			return '';
		}

		return value.length > 5 ? value.slice(0, 5) : value;
	}

	private normalizeTimeForPayload(value: string) {
		if (!value) {
			return value;
		}

		return value.length === 5 ? `${value}:00` : value;
	}

	onSubmit() {
		if (this.submitting || this.loading) {
			return;
		}

		if (this.eventForm.invalid || this.eventId === null) {
			this.eventForm.markAllAsTouched();
			return;
		}

		this.submitting = true;
		const eventData = {
			id: this.eventId,
			title: this.eventForm.value.title,
			date: this.eventForm.value.date,
			time: this.normalizeTimeForPayload(this.eventForm.value.time),
			location: this.eventForm.value.location,
			description: this.eventForm.value.description,
			category: resolveCategoryValue(this.eventForm.value.category, this.eventForm.value.customCategory),
		};

		if (!eventData.category) {
			this.submitting = false;
			this.eventForm.get('customCategory')?.markAsTouched();
			return;
		}

		this.http.put(apiUrl('/event/update'), eventData, { withCredentials: true }).subscribe({
			next: () => {
				this.submitting = false;
				this.notificationService.success('Etkinlik başarıyla güncellendi.');
				this.router.navigate(['/event-my']);
			},
			error: (error) => {
				this.submitting = false;
				this.notificationService.error('Etkinlik güncellenemedi: ' + (error.error?.message || 'Bilinmeyen hata'));
			},
		});
	}

	resetForm() {
		if (this.loading || this.originalFormSnapshot === null) {
			return;
		}

		this.eventForm.reset(this.originalFormSnapshot);
		this.eventForm.markAsPristine();
		this.eventForm.markAsUntouched();
		this.loading = false;
	}
}