import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLoader } from './layout/page-loader/page-loader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PageLoader],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
