import { Routes } from '@angular/router';
import { Login } from './login/login';
import { notAuthGuard } from './not-auth-guard';
import { Register } from './register/register';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './auth-guard';
import { Events } from './events/events';

export const routes: Routes = [
    {path: '', component: Login, canActivate: [notAuthGuard]},
    {path: 'register', component: Register, canActivate: [notAuthGuard]},
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            {path: 'events', component: Events}    
        ]
    }
];
