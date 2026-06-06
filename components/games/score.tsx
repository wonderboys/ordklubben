"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type ScoreProps = {
  score: number;
  wordsFound: number;
};

export function Score({ score, wordsFound }: ScoreProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="print-mono text-print-muted">Poäng</p>
          <motion.p
            key={score}
            initial={{ opacity: 0.6, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-3xl font-black tabular-nums tracking-[-0.05em]"
          >
            {score}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="print-mono text-print-muted">Ord</p>
          <p className="text-xl font-black tabular-nums">{wordsFound}</p>
        </div>
      </CardContent>
    </Card>
  );
}
