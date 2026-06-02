import type {
  CreatedBooth,
  CreatedEvent,
  ProcessedDocument,
} from '@features/exhibitor/exhibitor.service';

export interface ContactGroup {
  label: string;
  values: string[];
}

export interface QrPageData {
  event: CreatedEvent;
  booth: CreatedBooth;
  documents: ProcessedDocument[];
}
