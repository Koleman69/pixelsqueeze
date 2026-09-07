import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DeleteAccountDialogProps {
  /** Rendered as the dialog trigger. Defaults to a destructive button. */
  trigger?: React.ReactNode;
}

export function DeleteAccountDialog({ trigger }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account and data have been permanently removed.",
      });
      setOpen(false);
      await signOut();
      navigate("/");
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      toast({
        title: "Couldn't delete account",
        description: err?.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setConfirmText(""); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="destructive" className="w-full min-h-[48px]">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your account, your saved files, presets and history.
            This cannot be undone. If you have a paid subscription, cancel it in your
            app store or billing portal to stop future charges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect="off"
            className="min-h-[48px] text-base"
          />
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full min-h-[48px] sm:w-auto"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Keep my account
          </Button>
          <Button
            variant="destructive"
            className="w-full min-h-[48px] sm:w-auto"
            onClick={handleDelete}
            disabled={loading || confirmText.trim().toUpperCase() !== "DELETE"}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteAccountDialog;
