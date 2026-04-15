import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Pricing from '../components/Pricing';
import Footer from '../components/Footer';
import { usePageSEO } from '../hooks/usePageSEO';

const LandingPage: React.FC = () => {
  usePageSEO(
    'AI Lesson Planner for Teachers | LessonLift',
    'LessonLift is an AI lesson planner and teaching tool that helps teachers create classroom-ready lesson plans and resources in seconds.'
  );
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
};

export default LandingPage;