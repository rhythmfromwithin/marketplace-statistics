import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/contexts/LanguageContext";

type FeedbackCategory = "bug" | "feature" | "general";

const CATEGORY_ORDER: FeedbackCategory[] = ["general", "feature", "bug"];

export default function FeedbackWidget() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");

  const categoryLabel = (c: FeedbackCategory) =>
    c === "general" ? t.feedbackCatGeneral : c === "feature" ? t.feedbackCatFeature : t.feedbackCatBug;

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success(t.feedbackSuccessToast);
      setMessage("");
      setCategory("general");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`${t.feedbackFailedPrefix}${error.message}`);
    },
  });

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-border bg-card shadow-sm grid place-items-center text-primary hover:text-primary/90 transition-colors"
            aria-label={t.feedbackOpenAria}
            title={t.feedbackTitle}
          >
            <MessageCircleQuestion className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t.feedbackTitle}</DialogTitle>
            <DialogDescription>{t.feedbackDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((item) => (
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
            className="min-h-[120px]"
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => submitMutation.mutate({ category, message })}
              disabled={message.trim().length < 5 || submitMutation.isPending}
            >
              {submitMutation.isPending ? t.feedbackSubmitting : t.feedbackSubmit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

