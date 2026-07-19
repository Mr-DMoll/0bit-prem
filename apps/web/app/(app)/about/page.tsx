"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/features/public/PageHeader";
import MarkdownContent from "@/features/public/MarkdownContent";
import { publicContentService } from "@/features/public/services/content.service";

export default function AboutPage() {
  const [bio, setBio]             = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicContentService.getContent()
      .then((res) => setBio(res.data?.content?.about_bio ?? ""))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="About" />
      <p style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: "20px", fontStyle: "italic", fontWeight: 500,
        color: "var(--color-accent)", width: "100%",
        margin: "8px 0 32px", lineHeight: 1.5,
      }}>
        Devotional music, made and shared directly — no label, no algorithm, no noise.
      </p>

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : bio ? (
        <MarkdownContent markdown={bio} maxWidth="100%" />
      ) : (
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>About Premvkay — content coming soon.</p>
      )}
    </div>
  );
}
