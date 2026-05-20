'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { Mail, MessageSquare, Clock, Send, CheckCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/constants';

const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: SITE_CONFIG.email,
    description: 'We respond within 24 hours.',
  },
  {
    icon: MessageSquare,
    label: 'Live Chat',
    value: 'Available in dashboard',
    description: 'Fastest response for existing clients.',
  },
  {
    icon: Clock,
    label: 'Response Time',
    value: 'Under 24 hours',
    description: 'Mon–Fri, 9am–6pm UTC',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        setError(d.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-4">Get in Touch</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Have a question about our services? We are here to help. Reach out and our team will get back to you promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-6">
            {contactMethods.map(({ icon: Icon, label, value, description }) => (
              <div key={label} className="flex gap-4 p-5 rounded-2xl border border-[rgba(230,57,70,0.28)] bg-white/[0.03]">
                <div className="p-2.5 rounded-xl bg-accent-primary/10 h-fit">
                  <Icon className="h-5 w-5 text-accent-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-accent-primary text-sm">{value}</p>
                  <p className="text-text-tertiary text-xs mt-0.5">{description}</p>
                </div>
              </div>
            ))}

            <div className="p-5 rounded-2xl border border-[rgba(230,57,70,0.28)] bg-white/[0.03]">
              <p className="font-semibold text-sm mb-2">Already a client?</p>
              <p className="text-text-secondary text-sm">
                Log in to your dashboard and open a support ticket for faster, personalised assistance.
              </p>
              <a
                href="/login"
                className="inline-block mt-3 text-sm text-accent-primary hover:underline"
              >
                Go to Dashboard &rarr;
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-success/20 bg-success/5">
                <CheckCircle className="h-16 w-16 text-success mb-4" />
                <h3 className="text-xl font-heading font-bold">Message Sent!</h3>
                <p className="text-text-secondary mt-2">
                  Thank you for reaching out. We will respond within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 text-sm text-accent-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl border border-[rgba(230,57,70,0.28)] bg-white/[0.03]">
                <h2 className="text-xl font-heading font-bold mb-2">Send us a Message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <Select
                  label="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                >
                  <option value="">Select a subject...</option>
                  <option value="Challenge Passing Enquiry">Challenge Passing Enquiry</option>
                  <option value="Account Management Enquiry">Account Management Enquiry</option>
                  <option value="Pricing & Plans">Pricing & Plans</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Refund Request">Refund Request</option>
                  <option value="Other">Other</option>
                </Select>
                <Textarea
                  label="Message"
                  placeholder="Tell us how we can help..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  fullWidth
                  icon={<Send className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
