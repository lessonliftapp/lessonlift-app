import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Instagram, Youtube, Twitter, ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NewsletterFormWrapper: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!emailRegex.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage("You're subscribed! Check your inbox for a confirmation.");
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle'); }}
          placeholder="Enter your email address"
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="flex items-center justify-center gap-2 bg-[#4CAF50] hover:bg-[#45a049] disabled:opacity-60 text-white px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 whitespace-nowrap shadow-lg hover:shadow-xl"
        >
          {status === 'loading' ? (
            <><Loader2 size={16} className="animate-spin" /> Subscribing...</>
          ) : status === 'success' ? (
            <><Check size={16} /> Subscribed!</>
          ) : (
            <>Subscribe <ArrowRight size={16} /></>
          )}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm text-center ${status === 'success' ? 'text-[#4CAF50]' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gray-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="col-span-1 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-gray-300 leading-relaxed mb-8 max-w-md text-base">
                LessonLift provides AI planning tools designed exclusively for UK primary teachers — helping you save time, stay curriculum-aligned, and produce high-quality plans every day.
              </p>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail size={20} className="text-[#4CAF50]" />
                  <a href="mailto:lessonlift.app@gmail.com" className="text-gray-300 hover:text-white transition-colors">lessonlift.app@gmail.com</a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin size={20} className="text-[#4CAF50]" />
                  <span className="text-gray-300">Leeds, United Kingdom</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/explore-features" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/get-started" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/data-protection" className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 hover:translate-x-1 inline-block">
                  Data Protection
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Social Media & Copyright */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-gray-800 pt-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Social Media */}
            <div className="flex items-center space-x-6">
              <a
                href="https://www.youtube.com/channel/UCgMYV6CedRpMV9BeBwlPOnw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 transform hover:scale-110"
                aria-label="Subscribe to LessonLift on YouTube"
              >
                <Youtube size={28} />
              </a>
              <a
                href="https://www.instagram.com/lessonlift.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 transform hover:scale-110"
                aria-label="Follow LessonLift on Instagram"
              >
                <Instagram size={28} />
              </a>
              <a
                href="https://www.tiktok.com/@lessonlift.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 transform hover:scale-110"
                aria-label="Follow LessonLift on TikTok"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com/lessonlift"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 transform hover:scale-110"
                aria-label="Follow LessonLift on X (Twitter)"
              >
                <Twitter size={28} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=776749568857782"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#4CAF50] transition-all duration-300 transform hover:scale-110"
                aria-label="Follow LessonLift on Facebook"
              >
                <Facebook size={28} />
              </a>
            </div>

            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2026 LessonLift. All rights reserved.
            </div>
          </div>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-3xl p-10 mt-16 border border-gray-700"
        >
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get the latest teaching tips, curriculum updates, and LessonLift feature announcements
              delivered to your inbox.
            </p>
            <NewsletterFormWrapper />
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;