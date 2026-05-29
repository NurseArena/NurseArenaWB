'use client';
import { motion } from 'framer-motion';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminAnalyticsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Analytics</h1>
      <p className="text-sm text-ink-muted">Platform usage statistics and insights</p>
      <AdminDashboard />
    </motion.div>
  );
}
