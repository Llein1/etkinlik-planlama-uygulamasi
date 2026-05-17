import { formatDate } from '@angular/common';

function toDateValue(value: string | Date): Date | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (!value) {
		return null;
	}

	const normalizedValue = value.includes('T') ? value : `${value}T00:00:00`;
	const parsedDate = new Date(normalizedValue);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function toTimeValue(value: string | Date): Date | null {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (!value) {
		return null;
	}

	const normalizedValue = value.length === 5 ? `${value}:00` : value;
	const parsedDate = new Date(`1970-01-01T${normalizedValue}`);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatTurkishDate(value: string | Date | null | undefined): string {
	if (!value) {
		return '';
	}

	const parsedDate = toDateValue(value);

	if (!parsedDate) {
		return String(value);
	}

	return formatDate(parsedDate, 'dd.MM.yyyy', 'tr-TR');
}

export function formatTurkishTime(value: string | Date | null | undefined): string {
	if (!value) {
		return '';
	}

	const parsedDate = toTimeValue(value);

	if (!parsedDate) {
		return String(value);
	}

	return formatDate(parsedDate, 'HH.mm', 'tr-TR');
}