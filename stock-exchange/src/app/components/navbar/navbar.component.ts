import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, DatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  currentTime = new Date();
  mobileMenuOpen = false;

  get marketOpen(): boolean {
    const h = this.currentTime.getHours();
    const d = this.currentTime.getDay();
    return d >= 1 && d <= 5 && h >= 9 && h < 16;
  }

  constructor() {
    setInterval(() => this.currentTime = new Date(), 1000);
  }
}
