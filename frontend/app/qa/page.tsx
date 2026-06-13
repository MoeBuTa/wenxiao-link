import type { Metadata } from "next";

import { QABoard } from "../components/QABoard";

export const metadata: Metadata = {
  title: "Q&A",
  description: "Ask me anything — questions, comments, and discussion.",
};

export default function QAPage() {
  return <QABoard />;
}
