'use client';
import { motion } from 'framer-motion';
import { AdminQuestionUpload } from '@/components/admin/AdminQuestionUpload';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Library } from 'lucide-react';

export default function AdminQuestionsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Upload Questions</h1>
        <Link href="/admin/questions/bank">
          <Button variant="secondary">
            <Library size={18} />
            Question Bank
          </Button>
        </Link>
      </div>
      <AdminQuestionUpload />
    </motion.div>
  );
}
