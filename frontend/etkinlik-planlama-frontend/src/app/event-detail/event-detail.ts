import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { IEventDetail } from '../../models/IEvents';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';
import { FavoriteComponent } from '../shared/favorite/favorite';
import { NotificationService } from '../shared/notification.service';

interface ParticipantSummary {
	id?: number;
	fullName?: string;
	name?: string;
	email?: string;
	avatarUrl?: string;
}

@Component({
  selector: 'app-event-detail',
  imports: [TrDatePipe, TrTimePipe, FavoriteComponent, NgIf, RouterLink],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail {

  eventItem = signal<IEventDetail | null>(null);
  participants = signal<ParticipantSummary[]>([]);
  participantsLoading = signal<boolean>(false);
  participantsNotice = signal<string | null>(null);
  participantsModalOpen = signal<boolean>(false);
  joining = signal<boolean>(false);
  leaving = signal<boolean>(false);
  leaveConfirmOpen = signal<boolean>(false);
  private _participantsRequestSeq = 0;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) {
        this.notify.error('Etkinlik bulunamadı. Etkinlik listesine yönlendiriliyorsunuz.');
        this.router.navigate(['/events']);
        return;
      }

      this.eventItem.set(null);
      this.participants.set([]);
      this.participantsLoading.set(false);
      this.participantsModalOpen.set(false);
      this.leaveConfirmOpen.set(false);
      this.participantsNotice.set(null);
      this.joining.set(false);
      this.leaving.set(false);

      this.http.get<IEventDetail>(apiUrl(`/event/detail/${id}`), { withCredentials: true }).subscribe({
        next: (response) => {
          this.eventItem.set(response);
          this.refreshParticipationState(response.id);
        },
        error: (error) => {
          this.notify.error('Etkinlik detayları alınırken bir hata oluştu. Etkinlik listesine yönlendiriliyorsunuz.');
          this.router.navigate(['/events']);
        }
      });
    })
  }

  joinEvent() {
    const event = this.eventItem();
    if (!event || this.isJoinDisabled(event)) {
      return;
    }

    this.joining.set(true);
    const body = { eventId: event.id };
    this.http.post<any>(apiUrl('/participant/join'), body, { withCredentials: true }).subscribe({
      next: (res) => {
        this.notify.success(res?.message || 'Etkinliğe katıldınız.');
        const current = this.eventItem();
        if (current) {
          const newCount = (current.participantCount || 0) + 1;
          this.eventItem.set({ ...current, participantCount: newCount, isParticipant: true });
        }
        if (this.participantsModalOpen()) {
          // Optimistically add current user to the participants list so UI updates immediately
          const me = this.getCurrentParticipant();
          if (me) {
            const list = this.participants();
            const exists = list.some(p => (p.id && me.id && p.id === me.id) || (p.email && me.email && p.email.toLowerCase() === me.email.toLowerCase()));
            if (!exists) {
              this.participants.set([...(list || []), me]);
            }
          }
          // still trigger a reload so server-canonical list replaces optimistic entry when ready
          this.loadParticipants(event.id);
        }
        this.joining.set(false);
      },
      error: (err) => {
        this.joining.set(false);
        this.notify.error(err?.error?.message || 'Etkinliğe katılırken bir hata oluştu.');
      }
    });
  }

  leaveEvent() {
    const event = this.eventItem();
    if (!event || this.leaving() || !this.isParticipant(event)) {
      return;
    }

    this.leaveConfirmOpen.set(true);
    try {
      document.body.classList.add('modal-open');
    } catch (e) {
      console.error('Failed to add modal-open:', e);
    }
  }

  closeLeaveConfirmModal() {
    this.leaveConfirmOpen.set(false);
    try {
      if (!this.participantsModalOpen()) {
        document.body.classList.remove('modal-open');
      }
    } catch (e) {
      console.error('Failed to remove modal-open:', e);
    }
  }

  confirmLeaveEvent() {
    const event = this.eventItem();
    if (!event || this.leaving() || !this.isParticipant(event)) {
      return;
    }

    this.leaving.set(true);
    this.leaveConfirmOpen.set(false);
    this.http.delete<any>(apiUrl(`/participant/leave/${event.id}`), { withCredentials: true }).subscribe({
      next: (res) => {
        this.notify.success(res?.message || 'Etkinlikten ayrıldın.');
        const current = this.eventItem();
        if (current) {
          const newCount = Math.max((current.participantCount || 0) - 1, 0);
          this.eventItem.set({ ...current, participantCount: newCount, isParticipant: false });
        }

        if (this.participantsModalOpen()) {
          // Optimistically remove current user from participants list
          const me = this.getCurrentParticipant();
          if (me) {
            const filtered = this.participants().filter(p => {
              if (p.id && me.id) return p.id !== me.id;
              if (p.email && me.email) return p.email?.toLowerCase() !== me.email?.toLowerCase();
              return this.getParticipantLabel(p).trim().toLowerCase() !== this.getParticipantLabel(me).trim().toLowerCase();
            });
            this.participants.set(filtered);
          }
          // reload to sync with server
          this.loadParticipants(event.id);
        }

        this.leaving.set(false);
        try {
          if (!this.participantsModalOpen()) {
            document.body.classList.remove('modal-open');
          }
        } catch (e) {
          console.error('Failed to remove modal-open:', e);
        }
      },
      error: (err) => {
        this.leaving.set(false);
        this.notify.error(err?.error?.message || 'Etkinlikten ayrılırken bir hata oluştu.');
        try {
          if (!this.participantsModalOpen()) {
            document.body.classList.remove('modal-open');
          }
        } catch (e) {
          console.error('Failed to remove modal-open:', e);
        }
      }
    });
  }

  onFavoriteToggled(newState: boolean) {
    const current = this.eventItem();
    if (!current) {
      return;
    }

    this.eventItem.set({ ...current, isFavorite: newState });
  }

  openParticipantsModal() {
    const event = this.eventItem();
    if (!event) {
      return;
    }

    this.participantsModalOpen.set(true);
    // indicate a global modal is open so app chrome (navbar) can respond
    try { 
      document.body.classList.add('modal-open');
    } catch (e) { console.error('Failed to add modal-open:', e); }
    this.participantsNotice.set(null);

    // Always reload the participants list when the modal opens to avoid stale data
    this.participants.set([]);
    this.loadParticipants(event.id);
  }

  closeParticipantsModal() {
    this.participantsModalOpen.set(false);
    try { 
      if (!this.leaveConfirmOpen()) {
        document.body.classList.remove('modal-open');
      }
    } catch (e) { console.error('Failed to remove modal-open:', e); }
  }

  getStatusVariant(status: string): string {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes('published')) {
      return 'published';
    }

    if (normalizedStatus.includes('paused')) {
      return 'paused';
    }

    if (normalizedStatus.includes('archived')) {
      return 'archived';
    }

    return 'published';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes('published')) {
      return 'Yayında';
    }

    if (normalizedStatus.includes('paused')) {
      return 'Duraklatıldı';
    }

    if (normalizedStatus.includes('archived')) {
      return 'Arşivlendi';
    }

    return 'Yayında';
  }

  isParticipant(event: IEventDetail | null | undefined): boolean {
    return Boolean(event?.isParticipant || event?.isJoined || event?.joined);
  }

  isJoinDisabled(event: IEventDetail | null | undefined): boolean {
    if (!event) {
      return true;
    }

    const status = event.status?.toLowerCase?.() ?? '';
    const isBlockedStatus = status.includes('paused') || status.includes('archived');

    return this.joining() || this.isParticipant(event) || isBlockedStatus;
  }

  private refreshParticipationState(eventId: number) {
    const currentUserId = localStorage.getItem('id');
    const currentUserEmail = localStorage.getItem('email')?.trim().toLowerCase();
    const currentUserName = localStorage.getItem('name')?.trim().toLowerCase();

    if (!currentUserId && !currentUserEmail && !currentUserName) {
      return;
    }

    this.http.get<any>(apiUrl(`/participant/list/${eventId}`), { withCredentials: true }).subscribe({
      next: (response) => {
        const participants = this.extractParticipants(response);
        const isCurrentUserParticipant = participants.some(participant => {
          const participantId = participant.id?.toString();
          const participantEmail = participant.email?.trim().toLowerCase();
          const participantName = this.getParticipantLabel(participant).trim().toLowerCase();

          return Boolean(
            (currentUserId && participantId === currentUserId) ||
            (currentUserEmail && participantEmail === currentUserEmail) ||
            (currentUserName && participantName === currentUserName)
          );
        });

        const current = this.eventItem();
        if (current && isCurrentUserParticipant) {
          this.eventItem.set({ ...current, isParticipant: true });
        }
      },
      error: () => {
        // Leave the detail response as-is when the participant list cannot be read.
      },
    });
  }

  private getCurrentParticipant(): ParticipantSummary | null {
    const id = localStorage.getItem('id');
    const email = localStorage.getItem('email')?.trim();
    const name = localStorage.getItem('name')?.trim();

    if (!id && !email && !name) return null;

    const participant: ParticipantSummary = {};
    if (id) participant.id = Number(id);
    if (email) participant.email = email;
    if (name) participant.fullName = name;

    return participant;
  }

  getParticipantLabel(participant: ParticipantSummary): string {
    return participant.fullName || participant.name || participant.email || 'İsimsiz katılımcı';
  }

  getParticipantInitials(participant: ParticipantSummary): string {
    const label = this.getParticipantLabel(participant).trim();
    const initials = label
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('');

    return (initials || 'K').toUpperCase();
  }

  private loadParticipants(eventId: number) {
    this.participantsLoading.set(true);
    const reqId = ++this._participantsRequestSeq;
    this.http.get<any>(apiUrl(`/participant/list/${eventId}`), { withCredentials: true }).subscribe({
      next: (response) => {
        // ignore if a newer request was started after this one
        if (reqId !== this._participantsRequestSeq) {
          return;
        }
        this.participants.set(this.extractParticipants(response));
        this.participantsLoading.set(false);

        if (this.participants().length === 0) {
          const current = this.eventItem();
          if (current?.participantCount) {
            this.participantsNotice.set('Katılımcı listesi şu anda boş görünüyor.');
          }
        }
      },
      error: () => {
        if (reqId !== this._participantsRequestSeq) {
          return;
        }
        this.participants.set([]);
        this.participantsLoading.set(false);
        const current = this.eventItem();
        if (current?.participantCount) {
          this.participantsNotice.set('Katılımcı listesi şu anda yüklenemiyor.');
        }
      },
    });
  }

  private extractParticipants(response: unknown): ParticipantSummary[] {
    if (Array.isArray(response)) {
      return response as ParticipantSummary[];
    }

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      const content = record['content'];
      const participants = record['participants'];
      const data = record['data'];
      const items = record['items'];
      const list = content ?? participants ?? data ?? items;

      if (Array.isArray(list)) {
        return list as ParticipantSummary[];
      }
    }

    return [];
  }
}
