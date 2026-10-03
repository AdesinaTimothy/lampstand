"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Award, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function CourseCompleteDialog({
  open,
  onOpenChange,
  courseTitle,
  courseSlug,
  certificateId,
  certificateEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  courseSlug: string;
  certificateId: string | null;
  certificateEnabled: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="text-center">
        <div className="relative overflow-hidden px-6 pb-6 pt-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-soft to-transparent" aria-hidden />
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="relative mx-auto grid size-20 place-items-center rounded-full bg-accent text-white shadow-lg ring-8 ring-accent-soft"
            aria-hidden
          >
            {certificateEnabled ? <Award className="size-10" /> : <PartyPopper className="size-9" />}
          </motion.div>
          <DialogTitle className="text-display relative mt-6 text-2xl font-medium">Course complete</DialogTitle>
          <DialogDescription className="relative mt-2 text-base">
            You finished <strong className="font-semibold text-foreground">{courseTitle}</strong>.{" "}
            {certificateEnabled ? "Your certificate is ready." : "Well done for seeing it through."}
          </DialogDescription>
          <div className="relative mt-6 flex flex-col gap-2">
            {certificateEnabled && certificateId && (
              <Button asChild size="lg">
                <Link href={`/certificates/${certificateId}`}>View certificate</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/courses/${courseSlug}#reviews`}>Leave a review</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
