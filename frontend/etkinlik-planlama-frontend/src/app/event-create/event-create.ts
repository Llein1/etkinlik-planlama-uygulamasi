import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { apiUrl } from '../shared/api-url';
import { EVENT_CATEGORY_OPTIONS, OTHER_CATEGORY_OPTION, resolveCategoryValue } from '../shared/category-options';
import { NotificationService } from '../shared/notification.service';

@Component({
  selector: 'app-event-create',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css',
})
export class EventCreate {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  eventForm: FormGroup;
  submitting = false;
  today = this.formatDateInput(new Date());
  categories = EVENT_CATEGORY_OPTIONS;
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
  isDatePickerOpen = false;
  isTimePickerOpen = false;
  isHourListOpen = false;
  isMinuteListOpen = false;
  selectedHour = '00';
  selectedMinute = '00';
  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();

  constructor(private formBuilder: FormBuilder) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', [Validators.required, this.notPastDateValidator.bind(this)]],
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

  get selectedDateLabel() {
    const value = this.eventForm.get('date')?.value as string;

    return value ? this.formatDateLabel(value) : 'Tarih seçin';
  }

  get selectedTimeLabel() {
    const value = this.eventForm.get('time')?.value as string;

    return value || 'Saat seçin';
  }

  get hourOptions() {
    return Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, '0'));
  }

  get minuteOptions() {
    return Array.from({ length: 60 }, (_, index) => `${index}`.padStart(2, '0'));
  }

  get calendarCells() {
    const firstDayOfMonth = new Date(this.calendarYear, this.calendarMonth, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const previousMonthDays = new Date(this.calendarYear, this.calendarMonth, 0).getDate();
    const cells: Array<{ day: number; iso: string; inCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isDisabled: boolean }> = [];

    for (let index = 0; index < 42; index++) {
      const dayNumber = index - startOffset + 1;
      let year = this.calendarYear;
      let month = this.calendarMonth;
      let day = dayNumber;
      let inCurrentMonth = true;

      if (dayNumber <= 0) {
        month -= 1;
        if (month < 0) {
          month = 11;
          year -= 1;
        }
        day = previousMonthDays + dayNumber;
        inCurrentMonth = false;
      } else if (dayNumber > daysInMonth) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
        day = dayNumber - daysInMonth;
        inCurrentMonth = false;
      }

      const iso = this.formatDateInput(new Date(year, month, day));
      cells.push({
        day,
        iso,
        inCurrentMonth,
        isToday: iso === this.today,
        isSelected: iso === this.eventForm.get('date')?.value,
        isDisabled: iso < this.today,
      });
    }

    return cells;
  }

  get calendarWeeks() {
    const cells = this.calendarCells;
    const weeks: typeof cells[] = [];

    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }

    return weeks;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closePickers();
    }
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

  previousMonth() {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear -= 1;
      return;
    }

    this.calendarMonth -= 1;
  }

  nextMonth() {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear += 1;
      return;
    }

    this.calendarMonth += 1;
  }

  selectDate(dateValue: string) {
    if (dateValue < this.today) {
      return;
    }

    this.eventForm.get('date')?.setValue(dateValue);
    this.eventForm.get('date')?.markAsTouched();
    this.isDatePickerOpen = false;
  }

  selectTime(timeValue: string) {
    this.eventForm.get('time')?.setValue(timeValue);
    this.eventForm.get('time')?.markAsTouched();
    this.isTimePickerOpen = false;
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

  private notPastDateValidator(control: { value: string }) {
    if (!control.value) {
      return null;
    }

    return control.value < this.today ? { pastDate: true } : null;
  }

  private formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDateLabel(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private buildTimeOptions(stepMinutes: number) {
    const options: string[] = [];

    for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
      const hours = `${Math.floor(minutes / 60)}`.padStart(2, '0');
      const remainder = `${minutes % 60}`.padStart(2, '0');
      options.push(`${hours}:${remainder}`);
    }

    return options;
  }

  private syncTimeControlsFromForm() {
    const value = (this.eventForm.get('time')?.value as string) || '00:00';
    const [hour = '00', minute = '00'] = value.split(':');

    this.selectedHour = hour.padStart(2, '0');
    this.selectedMinute = minute.padStart(2, '0');
  }

  onSubmit() {
    if (this.submitting) {
      return;
    }

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const eventData = {
      title: this.eventForm.value.title,
      date: this.eventForm.value.date,
      time: this.eventForm.value.time,
      location: this.eventForm.value.location,
      category: resolveCategoryValue(this.eventForm.value.category, this.eventForm.value.customCategory),
      description: this.eventForm.value.description,
    };

    if (!eventData.category) {
      this.submitting = false;
      this.eventForm.get('customCategory')?.markAsTouched();
      return;
    }

    this.http.post(apiUrl('/event/create'), eventData, { withCredentials: true }).subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.success('Etkinlik başarıyla oluşturuldu.');
        this.router.navigate(['/events']);
      },
      error: (error) => {
        this.submitting = false;
        this.notificationService.error('Etkinlik oluşturulamadı: ' + (error.error?.message || 'Bilinmeyen hata'));
      },
    });
  }

  resetForm() {
    this.eventForm.reset();
    this.closePickers();
  }
}
