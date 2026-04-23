import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FeedbackCategory = "bug" | "feature" | "general";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully.");
      setMessage("");
      setCategory("general");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Submit failed: ${error.message}`);
    },
  });

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-border bg-card shadow-sm grid place-items-center text-primary hover:text-primary/90 transition-colors"
            aria-label="Open feedback form"
            title="Feedback"
          >
            <MessageCircleQuestion className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Tell us bugs, feature requests, or any suggestions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {(["general", "feature", "bug"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  category === item
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your feedback..."
            className="min-h-[120px]"
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => submitMutation.mutate({ category, message })}
              disabled={message.trim().length < 5 || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

