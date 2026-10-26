import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvalDashboardComponent } from './eval-dashboard.component';

interface Score { metric: string; score: number; rationale: string; passed: boolean; }
interface Ad { headline: string; body: string; callToAction: string; }
interface Validation { scores: Score[]; overallPass: boolean; hallucinatedClaims: string[]; summary: string; }
interface Result { query: string; ad: Ad; validation: Validation; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, EvalDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  view = signal<'generate' | 'dashboard'>('generate');
  query = signal('');
  loading = signal(false);
  result = signal<Result | null>(null);
  error = signal('');

  async run(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      const res = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: this.query() })
      });
      if (!res.ok) throw new Error(await res.text());
      this.result.set((await res.json()) as Result);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
