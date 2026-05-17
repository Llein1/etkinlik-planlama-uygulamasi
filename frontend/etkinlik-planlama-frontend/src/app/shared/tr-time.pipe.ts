import { Pipe, PipeTransform } from '@angular/core';
import { formatTurkishTime } from './date-time-format';

@Pipe({
	name: 'trTime',
	standalone: true,
})
export class TrTimePipe implements PipeTransform {
	transform(value: string | Date | null | undefined): string {
		return formatTurkishTime(value);
	}
}