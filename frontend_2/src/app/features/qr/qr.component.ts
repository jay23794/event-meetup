import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { CreatedBooth, ProcessedDocument } from '@features/exhibitor/exhibitor.service';
import { QrService } from './qr.service';
import { QrStateService } from './qr-state.service';
import type { ContactGroup, QrPageData } from './qr.models';

const SOCIAL_HOSTS = [
  'linkedin.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'github.com',
];

@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './qr.component.html',
})
export class QrComponent implements OnInit {
  private qrService = inject(QrService);
  private state = inject(QrStateService);
  private router = inject(Router);

  readonly data = signal<QrPageData | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly copied = signal(false);

  contactGroups = computed<ContactGroup[]>(() => {
    const page = this.data();
    if (!page) return [];
    return this.buildContactGroups(page.documents);
  });

  ngOnInit(): void {
    const page = this.state.get();
    if (!page) return;
    this.data.set(page);
    void this.renderQr(page.booth.qrUrl);
  }

  async copyUrl(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      this.copied.set(false);
    }
  }

  downloadName(booth: CreatedBooth): string {
    const slug = booth.boothName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `booth-${slug || booth.qrId}.png`;
  }

  hasExtractedFields(doc: ProcessedDocument): boolean {
    return Boolean(
      doc.extractedName ||
        doc.extractedTitle ||
        doc.extractedCompany ||
        doc.extractedEmail ||
        doc.extractedPhone ||
        doc.extractedWebsite ||
        doc.extractedAddress,
    );
  }

  ensureHttp(value: string): string {
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  }

  private async renderQr(url: string): Promise<void> {
    try {
      const dataUrl = await this.qrService.toDataUrl(url);
      this.qrDataUrl.set(dataUrl);
    } catch {
      this.qrDataUrl.set(null);
    }
  }

  private buildContactGroups(docs: ProcessedDocument[]): ContactGroup[] {
    const phones = new Set<string>();
    const emails = new Set<string>();
    const websites = new Set<string>();
    const socials = new Set<string>();

    for (const doc of docs) {
      if (doc.extractedPhone) phones.add(doc.extractedPhone);
      if (doc.extractedEmail) emails.add(doc.extractedEmail);
      if (doc.extractedWebsite) {
        if (this.isSocial(doc.extractedWebsite)) {
          socials.add(doc.extractedWebsite);
        } else {
          websites.add(doc.extractedWebsite);
        }
      }
    }

    const groups: ContactGroup[] = [];
    if (phones.size) groups.push({ label: 'Mobile', values: [...phones] });
    if (socials.size)
      groups.push({ label: 'Social Media', values: [...socials] });
    if (websites.size) groups.push({ label: 'Website', values: [...websites] });
    if (emails.size) groups.push({ label: 'Email', values: [...emails] });
    return groups;
  }

  private isSocial(value: string): boolean {
    const lower = value.toLowerCase();
    return SOCIAL_HOSTS.some((host) => lower.includes(host));
  }
}
