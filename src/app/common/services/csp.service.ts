import { Meta } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CspService {
  constructor(private meta: Meta) {}

  setCSPPolicy(policy: string): void {
    this.meta.updateTag({
      httpEquiv: 'Content-Security-Policy',
      content: policy,
    });
  }
}
