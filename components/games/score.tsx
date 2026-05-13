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
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Poäng</p>
          <motion.p
            key={score}
            initial={{ opacity: 0.6, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-[-0.05em]"
          >
            {score}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Ord</p>
          <p className="text-xl font-semibold">{wordsFound}</p>
        </div>
      </CardContent>
    </Card>
  );
}
