import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

type FeedbackCategory = "bug" | "feature" | "general";

export default function FeedbackCard() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Thanks for your feedback!");
      setMessage("");
      setCategory("general");
    },
    onError: (error) => {
      toast.error(`Submit failed: ${error.message}`);
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Feedback</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Tell us what to improve in this MVP.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
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
        placeholder="Share your issue or suggestion..."
        className="min-h-[100px]"
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => submitMutation.mutate({ category, message })}
          disabled={message.trim().length < 5 || submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Send feedback"}
        </Button>
      </div>
    </div>
  );
}
