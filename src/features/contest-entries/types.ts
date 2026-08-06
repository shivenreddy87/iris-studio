export type ContestEntryStatus =
  | "applied"
  | "shortlisted"
  | "selected"
  | "rejected"
  | "withdrawn"
  | "submitted"
  | "won";

export const CONTEST_ENTRY_STATUS_LABELS: Record<ContestEntryStatus, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  selected: "Selected",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
  submitted: "Submission received",
  won: "Winner",
};

export type ContestEntry = {
  id: string;
  contestId: string;
  contestTitle: string;
  influencerId: string;
  influencerName: string | null;
  pitch: string | null;
  submissionUrl: string | null;
  status: ContestEntryStatus;
  appliedAt: string;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContestEntryInput = {
  contestId: string;
  pitch?: string;
};
