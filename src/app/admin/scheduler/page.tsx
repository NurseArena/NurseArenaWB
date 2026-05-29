'use client';
import { motion } from 'framer-motion';
import { AdminScheduler } from '@/components/admin/AdminScheduler';

export default function AdminSchedulerPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-ink">Schedule Events</h1>
      <p className="text-sm text-ink-muted">Schedule mock tests and 9 PM live quiz slots</p>
      <AdminScheduler />
    </motion.div>
  );
}
