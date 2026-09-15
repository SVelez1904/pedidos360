import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clpCurrency',
  standalone: true
})
export class ClpCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0';
    }
    return '$' + Math.round(value).toLocaleString('es-CL');
  }
}
