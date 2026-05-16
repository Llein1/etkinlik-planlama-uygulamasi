import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { apiUrl } from '../shared/api-url';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private http = inject(HttpClient);
  private router = inject(Router);
  registerForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      // Kayıt işlemi burada yapılacak
      const registerData = this.registerForm.value;
      this.http.post(apiUrl('/user/register'), registerData, { withCredentials: true }).subscribe({
        next: (response) => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          alert('Kayıt başarısız: ' + (error.error?.message || 'Bilinmeyen hata'));
        }
      })
    }
  }

}
