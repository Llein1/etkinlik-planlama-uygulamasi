import { Routes } from '@angular/router';
import { Login } from './login/login';
import { notAuthGuard } from './not-auth-guard';
import { Register } from './register/register';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './auth-guard';
import { Events } from './events/events';
import { EventSearch } from './event-search/event-search';
import { EventDetail } from './event-detail/event-detail';
import { EventCreate } from './event-create/event-create';

export const routes: Routes = [
    {path: '', component: Login, canActivate: [notAuthGuard], pathMatch: 'full'},
    {path: 'register', component: Register, canActivate: [notAuthGuard], pathMatch: 'full'},
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            {path: 'events', component: Events}, 
            {path: 'event-search', component: EventSearch},
            {path: 'event/detail/:id', component: EventDetail},
            {path: 'event-create', component: EventCreate}
        ]
    },
    {path: '**', redirectTo: ''}
];
