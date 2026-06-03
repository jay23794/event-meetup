export interface SharedDocument {
  url: string;
  fileName?: string;
}

export interface VisitedBoothContacts {
  names: string[];
  companies: string[];
  titles: string[];
  phones: string[];
  emails: string[];
  websites: string[];
  socials: string[];
  addresses: string[];
}

export const EMPTY_VISITED_BOOTH_CONTACTS: VisitedBoothContacts = {
  names: [],
  companies: [],
  titles: [],
  phones: [],
  emails: [],
  websites: [],
  socials: [],
  addresses: [],
};

export interface VisitedBooth {
  qrId: string;
  boothName: string;
  eventName: string;
  timestamp: string;
  contacts: VisitedBoothContacts;
  sharedDocuments: SharedDocument[];
}
