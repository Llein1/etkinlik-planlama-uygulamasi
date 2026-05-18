import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { IEventDetail } from '../../models/IEvents';
import { EVENT_CATEGORY_OPTIONS, OTHER_CATEGORY_OPTION, resolveCategoryValue, splitCategoryValue } from '../shared/category-options';
import { apiUrl } from '../shared/api-url';
import { NotificationService } from '../shared/notification.service';

const EVENT_STATUS_OPTIONS = [
	{ value: 'published', label: 'Yayında' },
	{ value: 'paused', label: 'Duraklatıldı' },
	{ value: 'archived', label: 'Arşivle' },
];

@Component({
    selector: 'app-event-update',
    imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule],
	templateUrl: './event-update.html',
	styleUrl: './event-update.css',
})
export class EventUpdate implements OnDestroy {
	private http = inject(HttpClient);
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private notificationService = inject(NotificationService);
	private elementRef = inject(ElementRef);

	eventForm: FormGroup;
	submitting = false;
	deleting = false;
	loading = true;
	showArchiveConfirmModal = false;
	showDeleteConfirmModal = false;
	isDatePickerOpen = false;
	isTimePickerOpen = false;
	isHourListOpen = false;
	isMinuteListOpen = false;
	eventId: number | null = null;
	categories = EVENT_CATEGORY_OPTIONS;
	statusOptions = EVENT_STATUS_OPTIONS;
	monthNames = [
		'Ocak',
		'Şubat',
		'Mart',
		'Nisan',
		'Mayıs',
		'Haziran',
		'Temmuz',
		'Ağustos',
		'Eylül',
		'Ekim',
		'Kasım',
		'Aralık',
	];
	weekdayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
	selectedHour = '00';
	selectedMinute = '00';
	calendarYear = new Date().getFullYear();
	calendarMonth = new Date().getMonth();
	private originalFormSnapshot: Record<string, string> | null = null;

	constructor(private formBuilder: FormBuilder) {
		this.eventForm = this.formBuilder.group({
			title: ['', [Validators.required, Validators.minLength(3)]],
			date: ['', [Validators.required]],
			time: ['', [Validators.required]],
			location: ['', [Validators.required, Validators.minLength(2)]],
			category: ['', [Validators.required]],
			customCategory: [''],
			status: ['published', [Validators.required]],
			description: ['', [Validators.required, Validators.minLength(10)]],
		});

		this.syncCustomCategoryRules();
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent) {
		if (!this.elementRef.nativeElement.contains(event.target)) {
			this.closePickers();
		}
	}

	get hourOptions() {
		return Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, '0'));
	}

	get minuteOptions() {
		return Array.from({ length: 60 }, (_, index) => `${index}`.padStart(2, '0'));
	}

	toggleDatePicker() {
		this.isDatePickerOpen = !this.isDatePickerOpen;
		this.isTimePickerOpen = false;
		this.syncCalendarToSelectedDate();
	}

	toggleTimePicker() {
		this.isTimePickerOpen = !this.isTimePickerOpen;
		this.isDatePickerOpen = false;
		this.isHourListOpen = false;
		this.isMinuteListOpen = false;

		if (this.isTimePickerOpen) {
			this.syncTimeControlsFromForm();
		}
	}

	closePickers() {
		this.isDatePickerOpen = false;
		this.isTimePickerOpen = false;
		this.isHourListOpen = false;
		this.isMinuteListOpen = false;
	}

	openArchiveConfirm() {
		this.showArchiveConfirmModal = true;
		this.syncModalBodyState();
	}

	closeArchiveConfirm() {
		this.showArchiveConfirmModal = false;
		this.syncModalBodyState();
	}

	openDeleteConfirm() {
		this.showDeleteConfirmModal = true;
		this.syncModalBodyState();
	}

	closeDeleteConfirm() {
		this.showDeleteConfirmModal = false;
		this.syncModalBodyState();
	}

	confirmArchiveAndSubmit() {
		this.closeArchiveConfirm();
		this.submitEvent(true);
	}

	confirmDeleteEvent() {
		if (this.eventId === null || this.deleting || this.submitting) {
			return;
		}

		this.deleting = true;
		this.closeDeleteConfirm();

		this.http.delete(apiUrl(`/event/deleteOne/${this.eventId}`), { withCredentials: true }).subscribe({
			next: () => {
				this.deleting = false;
				this.notificationService.success('Etkinlik başarıyla silindi.');
				this.router.navigate(['/event-my']);
			},
			error: (error) => {
				this.deleting = false;
				this.notificationService.error('Etkinlik silinemedi: ' + (error.error?.message || 'Bilinmeyen hata'));
			},
		});
	}

	toggleHourList() {
		this.isHourListOpen = !this.isHourListOpen;
		this.isMinuteListOpen = false;
	}

	toggleMinuteList() {
		this.isMinuteListOpen = !this.isMinuteListOpen;
		this.isHourListOpen = false;
	}

	selectHour(hour: string) {
		this.selectedHour = hour;
		this.isHourListOpen = false;
		this.updateTimeSelection();
	}

	selectMinute(minute: string) {
		this.selectedMinute = minute;
		this.isMinuteListOpen = false;
		this.updateTimeSelection();
	}

	selectDate(dateValue: string) {
		this.eventForm.get('date')?.setValue(dateValue);
		this.eventForm.get('date')?.markAsTouched();
		this.isDatePickerOpen = false;
	}

	updateTimeSelection() {
		const timeValue = `${this.selectedHour}:${this.selectedMinute}`;
		this.eventForm.get('time')?.setValue(timeValue);
		this.eventForm.get('time')?.markAsTouched();
	}

	private syncCalendarToSelectedDate() {
		const selectedDate = this.eventForm.get('date')?.value as string;
		const sourceDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();

		if (!Number.isNaN(sourceDate.getTime())) {
			this.calendarYear = sourceDate.getFullYear();
			this.calendarMonth = sourceDate.getMonth();
		}
	}

	private syncTimeControlsFromForm() {
		const value = (this.eventForm.get('time')?.value as string) || '00:00';
		const [hour = '00', minute = '00'] = value.split(':');

		this.selectedHour = hour.padStart(2, '0');
		this.selectedMinute = minute.padStart(2, '0');
	}

	/**
	 * Calendar generation and navigation helpers
	 */
	previousMonth() {
		if (this.calendarMonth === 0) {
			this.calendarMonth = 11;
			this.calendarYear -= 1;
		} else {
			this.calendarMonth -= 1;
		}
	}

	nextMonth() {
		if (this.calendarMonth === 11) {
			this.calendarMonth = 0;
			this.calendarYear += 1;
		} else {
			this.calendarMonth += 1;
		}
	}

	formatDateInput(date?: Date) {
		const d = date ?? new Date();
		const yyyy = d.getFullYear();
		const mm = `${d.getMonth() + 1}`.padStart(2, '0');
		const dd = `${d.getDate()}`.padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	get calendarCells() {
		const cells: Array<{
			day: number;
			iso: string;
			inCurrentMonth: boolean;
			isToday: boolean;
			isSelected: boolean;
			isDisabled: boolean;
		}> = [];

		const year = this.calendarYear;
		const month = this.calendarMonth;
		const firstOfMonth = new Date(year, month, 1);
		// JS: 0 = Sunday, 1 = Monday, ... We want Monday-first grid
		const startIndex = (firstOfMonth.getDay() + 6) % 7; // offset to Monday
		const totalCells = 42; // 6 weeks

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 0; i < totalCells; i++) {
			const dayOffset = i - startIndex;
			const cellDate = new Date(year, month, 1 + dayOffset);
			const inCurrentMonth = cellDate.getMonth() === month;
			const iso = this.formatDateInput(cellDate);
			const isToday = cellDate.getTime() === today.getTime();
			const selectedIso = this.eventForm.get('date')?.value as string;
			const isSelected = Boolean(selectedIso && selectedIso === iso);
			const isDisabled = cellDate.getTime() < today.getTime();

			cells.push({
				day: cellDate.getDate(),
				iso,
				inCurrentMonth,
				isToday,
				isSelected,
				isDisabled,
			});
		}

		return cells;
	}

	get isCustomCategorySelected() {
		return this.eventForm.get('category')?.value === OTHER_CATEGORY_OPTION;
	}

	get selectedStatus() {
		return this.normalizeStatusValue(this.eventForm.get('status')?.value as string);
	}

	get selectedStatusLabel() {
		return this.statusOptions.find((option) => option.value === this.selectedStatus)?.label ?? 'Yayında';
	}

	get isArchiveStatusSelected() {
		return this.selectedStatus === 'archived';
	}

	private normalizeStatusValue(value: string) {
		return (value || 'published').toLowerCase();
	}

	private getStatusEndpoint(status: string) {
		switch (this.normalizeStatusValue(status)) {
			case 'paused':
				return '/event/pause';
			case 'archived':
				return '/event/archive';
			case 'published':
			default:
				return '/event/publish';
		}
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
			status: this.normalizeStatusValue(eventState.status ?? 'published'),
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
					status: this.normalizeStatusValue(response.status),
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
		this.submitEvent();
	}

	private submitEvent(allowArchive = false) {
		if (this.submitting || this.loading) {
			return;
		}

		if (this.eventForm.invalid || this.eventId === null) {
			this.eventForm.markAllAsTouched();
			return;
		}

		if (!allowArchive && this.isArchiveStatusSelected) {
			this.openArchiveConfirm();
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

		const nextStatus = this.normalizeStatusValue(this.eventForm.value.status);
		const previousStatus = this.normalizeStatusValue(this.originalFormSnapshot?.['status'] ?? 'published');
		const shouldUpdateStatus = nextStatus !== previousStatus;

		this.http.put(apiUrl('/event/update'), eventData, { withCredentials: true }).subscribe({
			next: () => {
				if (!shouldUpdateStatus) {
					this.submitting = false;
					this.closeArchiveConfirm();
					this.notificationService.success('Etkinlik başarıyla güncellendi.');
					this.router.navigate(['/event-my']);
					return;
				}

				this.http.put(apiUrl(`${this.getStatusEndpoint(nextStatus)}/${eventData.id}`), {}, { withCredentials: true }).subscribe({
					next: () => {
						this.submitting = false;
						this.closeArchiveConfirm();
						this.notificationService.success('Etkinlik başarıyla güncellendi.');
						this.router.navigate(['/event-my']);
					},
					error: (error) => {
						this.submitting = false;
						this.closeArchiveConfirm();
						this.notificationService.error('Etkinlik durumu güncellenemedi: ' + (error.error?.message || 'Bilinmeyen hata'));
					},
				});
			},
			error: (error) => {
				this.submitting = false;
				this.closeArchiveConfirm();
				this.notificationService.error('Etkinlik güncellenemedi: ' + (error.error?.message || 'Bilinmeyen hata'));
			},
		});
	}

	resetForm() {
		if (this.loading || this.originalFormSnapshot === null) {
			return;
		}

		this.closeArchiveConfirm();
		this.closeDeleteConfirm();
		this.eventForm.reset(this.originalFormSnapshot);
		this.eventForm.markAsPristine();
		this.eventForm.markAsUntouched();
		this.loading = false;
	}

	ngOnDestroy() {
		this.closeArchiveConfirm();
		this.closeDeleteConfirm();
	}

	private syncModalBodyState() {
		try {
			if (this.showArchiveConfirmModal || this.showDeleteConfirmModal) {
				document.body.classList.add('modal-open');
			} else {
				document.body.classList.remove('modal-open');
			}
		} catch (e) {
			console.error('Failed to sync modal body state:', e);
		}
	}
}