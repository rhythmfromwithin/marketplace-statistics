import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/contexts/LanguageContext";
import { useState } from "react";
import { toast } from "sonner";

type FeedbackCategory = "bug" | "feature" | "general";

export default function FeedbackCard() {
  const { t } = useLang();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");

  const categoryLabel = (c: FeedbackCategory) =>
    c === "general" ? t.feedbackCatGeneral : c === "feature" ? t.feedbackCatFeature : t.feedbackCatBug;

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success(t.feedbackSuccessToast);
      setMessage("");
      setCategory("general");
    },
    onError: (error) => {
      toast.error(`${t.feedbackFailedPrefix}${error.message}`);
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t.feedbackCardTitle}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t.feedbackCardLead}</p>
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
            {categoryLabel(item)}
          </button>
        ))}
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.feedbackPlaceholder}
        className="min-h-[100px]"
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => submitMutation.mutate({ category, message })}
          disabled={message.trim().length < 5 || submitMutation.isPending}
        >
          {submitMutation.isPending ? t.feedbackSubmitting : t.feedbackCardSubmit}
        </Button>
      </div>
    </div>
  );
}
