import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { evalExamples, evalMetrics } from './eval-data';

@Component({
  selector: 'app-eval-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eval-dashboard.component.html',
  styleUrl: './eval-dashboard.component.scss',
})
export class EvalDashboardComponent implements OnDestroy {
  readonly metrics = evalMetrics;
  readonly examples = evalExamples;

  private readonly countsCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('countsCanvas');
  private readonly metricsCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('metricsCanvas');
  private charts: Chart[] = [];

  constructor() {
    afterNextRender(() => this.renderCharts());
  }

  private renderCharts(): void {
    const counts = this.countsCanvas()?.nativeElement;
    if (counts) {
      this.charts.push(
        new Chart(counts, {
          type: 'bar',
          data: {
            labels: [
              'True positive',
              'False positive',
              'False negative',
              'True negative',
            ],
            datasets: [
              {
                label: 'Examples',
                data: [
                  this.metrics.truePositive,
                  this.metrics.falsePositive,
                  this.metrics.falseNegative,
                  this.metrics.trueNegative,
                ],
                backgroundColor: ['#16a34a', '#dc2626', '#d97706', '#2563eb'],
              },
            ],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          },
        }),
      );
    }

    const metricsEl = this.metricsCanvas()?.nativeElement;
    if (metricsEl) {
      this.charts.push(
        new Chart(metricsEl, {
          type: 'bar',
          data: {
            labels: ['Precision', 'Recall', 'F1', 'Accuracy'],
            datasets: [
              {
                label: 'Score',
                data: [
                  this.metrics.precision,
                  this.metrics.recall,
                  this.metrics.f1,
                  this.metrics.accuracy,
                ],
                backgroundColor: '#2563eb',
              },
            ],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 1 } },
          },
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.charts.forEach((chart) => chart.destroy());
  }
}
