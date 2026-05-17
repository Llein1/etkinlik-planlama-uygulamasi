import { Pipe, PipeTransform } from '@angular/core';
import { formatTurkishDate } from './date-time-format';

@Pipe({
	name: 'trDate',
	standalone: true,
})
export class TrDatePipe implements PipeTransform {
	transform(value: string | Date | null | undefined): string {
		return formatTurkishDate(value);
	}
}