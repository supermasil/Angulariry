export interface CommentModel { // From backend
  _id: string;
  creatorId: string;
  trackingId: string;
  creatorName: string;
  imagePaths: [string];
  content: string;
  attachmentPaths: [string];
  createdAt: Date;
  updatedAt: Date;
}
