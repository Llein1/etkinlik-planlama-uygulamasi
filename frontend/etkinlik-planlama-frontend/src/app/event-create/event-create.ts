import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { apiUrl } from '../shared/api-url';

@Component({
  selector: 'app-event-create',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css',
})
export class EventCreate {
  private http = inject(HttpClient);
  private router = inject(Router);

  eventForm: FormGroup;
  submitting = false;
  today = new Date().toISOString().split('T')[0];
  categories = ['Konser', 'Eğitim', 'Teknoloji', 'Spor', 'Sosyal', 'Diğer'];

  constructor(private formBuilder: FormBuilder) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      location: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
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
    const eventData = this.eventForm.value;

    this.http.post(apiUrl('/event/create'), eventData, { withCredentials: true }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/events']);
      },
      error: (error) => {
        this.submitting = false;
        alert('Etkinlik oluşturulamadı: ' + (error.error?.message || 'Bilinmeyen hata'));
      },
    });
  }

  resetForm() {
    this.eventForm.reset();
  }
}
