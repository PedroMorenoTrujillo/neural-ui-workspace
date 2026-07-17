import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { provideNeuralUI } from '@neural-ui/core';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection(), provideRouter([]), provideNeuralUI()],
});
