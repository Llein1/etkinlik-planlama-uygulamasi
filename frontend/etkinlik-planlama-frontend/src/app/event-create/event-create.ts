import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { apiUrl } from '../shared/api-url';
import { EVENT_CATEGORY_OPTIONS, OTHER_CATEGORY_OPTION, resolveCategoryValue } from '../shared/category-options';
import { NotificationService } from '../shared/notification.service';

@Component({
  selector: 'app-event-create',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css',
})
export class EventCreate {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  eventForm: FormGroup;
  submitting = false;
  today = new Date().toISOString().split('T')[0];
  categories = EVENT_CATEGORY_OPTIONS;

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
  }
}
