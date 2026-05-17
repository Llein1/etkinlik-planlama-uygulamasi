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
import { EventMy } from './event-my/event-my';
import { EventUpdate } from './event-update/event-update';
import { FavoriteMy } from './favorite-my/favorite-my';
import { ParticipantMy } from './participant-my/participant-my';

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
            {path: 'favorite-my', component: FavoriteMy},
            {path: 'event-my', component: EventMy},
            {path: 'participant-my', component: ParticipantMy},
            {path: 'event/detail/:id', component: EventDetail},
            {path: 'event-create', component: EventCreate},
            {path: 'event/update/:id', component: EventUpdate}
        ]
    },
    {path: '**', redirectTo: ''}
];
