import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-[#4CAF50] transition-colors mb-8 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-300 text-lg max-w-xl">
              Have a question, suggestion, or need support? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Contact Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
            <p className="text-gray-600 leading-relaxed">
              Whether you have a question about features, pricing, or anything else, our team is ready to help.
            </p>

            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-[#4CAF50]/10 rounded-xl p-3 flex-shrink-0">
                  <Mail size={22} className="text-[#4CAF50]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                  <p className="text-gray-500 text-sm mb-3">Send us a message and we'll get back to you as soon as possible.</p>
                  <a
                    href="mailto:lessonlift.app@gmail.com"
                    className="inline-flex items-center space-x-2 bg-[#4CAF50] hover:bg-[#45a049] text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 text-sm"
                  >
                    <Mail size={16} />
                    <span>lessonlift.app@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-[#4CAF50]/10 rounded-xl p-3 flex-shrink-0">
                  <MapPin size={22} className="text-[#4CAF50]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Based In</h3>
                  <p className="text-gray-500 text-sm">Leeds, United Kingdom</p>
                </div>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-[#4CAF50]/10 rounded-xl p-3 flex-shrink-0">
                  <Clock size={22} className="text-[#4CAF50]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
                  <p className="text-gray-500 text-sm">We typically respond within 1–2 business days.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What to contact us about */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">How Can We Help?</h2>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              {[
                { title: 'Technical Support', desc: 'Issues with the platform, login problems, or bugs.' },
                { title: 'Billing & Subscriptions', desc: 'Questions about your plan, charges, or cancellations.' },
                { title: 'Feature Requests', desc: 'Ideas or suggestions to make LessonLift better for teachers.' },
                { title: 'General Enquiries', desc: "Anything else \u2014 we're happy to chat!" },
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-2 h-2 bg-[#4CAF50] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#4CAF50]/10 to-[#4CAF50]/5 rounded-2xl p-6 border border-[#4CAF50]/20">
              <p className="text-gray-700 text-sm leading-relaxed">
                For the fastest response, please include as much detail as possible in your email — such as your account email, the issue you're experiencing, and any relevant screenshots.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
