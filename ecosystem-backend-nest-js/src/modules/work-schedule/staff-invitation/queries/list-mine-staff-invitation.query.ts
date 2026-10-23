export class ListMineStaffInvitationsQuery {
  constructor(public readonly clerkId: string) {}
}

export interface ListMineStaffInvitationsResponse {
  invitations: {
    id: string;
    staffName: string;
    placeName: string;
    status:
      | 'ISSUED'
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'REVOKED'
      | 'EXPIRED';
    expiresAt: string;
    requestedAt: string | null;
  }[];
}
