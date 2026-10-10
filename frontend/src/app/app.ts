import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Score { metric: string; score: number; rationale: string; passed: boolean; }
interface Ad { headline: string; body: string; callToAction: string; }
interface Validation { scores: Score[]; overallPass: boolean; hallucinatedClaims: string[]; summary: string; }
interface Result { query: string; ad: Ad; validation: Validation; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  query = '';
  loading = false;
  result: Result | null = null;
  error = '';

  async run(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.result = null;
    try {
      const res = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: this.query })
      });
      if (!res.ok) throw new Error(await res.text());
      this.result = (await res.json()) as Result;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.loading = false;
    }
  }
}
