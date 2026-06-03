export interface SharedDocument {
  url: string;
  fileName?: string;
}

export interface VisitedBooth {
  qrId: string;
  boothName: string;
  eventName: string;
  timestamp: string;
  sharedDocuments: SharedDocument[];
}
