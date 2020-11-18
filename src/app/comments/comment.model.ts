export interface Comment { // From backend
  _id: string;
  creatorId: string;
  trackingId: string;
  name: string;
  imagePaths: [string];
  content: string;
  attachmentPaths: [string];
  createdAt: Date;
  updatedAt: Date;
}
