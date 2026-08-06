import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUserRow } from "../types";

export function SuspensionDialog({
  user,
  role,
  pending,
  onClose,
  onConfirm,
}: {
  user: AdminUserRow | null;
  role: "business" | "influencer";
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (user) setReason("");
  }, [user]);

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {user?.name}</DialogTitle>
          <DialogDescription>
            The {role} keeps read access but cannot submit new{" "}
            {role === "business" ? "campaign requests" : "applications or content"} until
            reactivated. The reason is recorded in the moderation log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="suspension-reason">Reason</Label>
          <Textarea
            id="suspension-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="Explain why this account is being suspended…"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending || reason.trim().length < 5}
            onClick={() => onConfirm(reason.trim())}
          >
            Suspend account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
