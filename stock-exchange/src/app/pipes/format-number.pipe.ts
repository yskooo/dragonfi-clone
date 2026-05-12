import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatNumber', standalone: true })
export class FormatNumberPipe implements PipeTransform {
  transform(value: number, type: 'price' | 'cap' | 'volume' | 'percent' | 'currency' = 'price'): string {
    if (value === null || value === undefined) return '-';
    switch (type) {
      case 'price':
        return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      case 'currency':
        return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      case 'cap':
        if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
        return '$' + value.toFixed(0);
      case 'volume':
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value.toFixed(0);
      case 'percent':
        return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
    }
  }
}
