export interface HistoryModel { // From backend
  _id: string;
  userId: string;
  action: string;
  postId: string;  // sev-123213 mst123452
  organization: string;
  createdAt: Date;
  updatedAt: Date;
}




