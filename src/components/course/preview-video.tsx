"use client";

import { PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PreviewVideoButton({ src, title }: { src: string; title: string }) {
  return (
    <Dialog>
      <DialogTrigger className="group absolute inset-0 grid place-items-center bg-black/25 transition-colors hover:bg-black/35">
        <span className="flex flex-col items-center gap-2 text-white">
          <span className="grid size-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-105">
            <PlayCircle className="size-7" aria-hidden />
          </span>
          <span className="text-sm font-semibold drop-shadow">Preview this course</span>
        </span>
      </DialogTrigger>
      <DialogContent size="xl" className="bg-black p-0 text-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Course preview</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <video src={src} controls autoPlay playsInline className="aspect-video w-full bg-black" aria-label={`Preview: ${title}`} />
      </DialogContent>
    </Dialog>
  );
}
