import React from 'react';
import { Building2 } from 'lucide-react';

export function ForSchools() {
  const handleContactSchools = () => {
    const email = 'lessonlift.app@gmail.com';
    const subject = encodeURIComponent('School Pricing Request');
    const body = encodeURIComponent(
      'Hello,\n\nI am interested in LessonLift for our school.\n\nPlease send information about school pricing and multi-teacher access.\n\nThank you.'
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <Building2 className="h-12 w-12 text-[#4CAF50]" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          For Schools & Multi-Teacher Licences
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          Are you a primary school looking to give your teachers access to LessonLift?
        </p>

        <p className="text-base text-gray-600 mb-8">
          We offer custom pricing for schools and multi-teacher access.
        </p>

        <p className="text-base text-gray-600 mb-8">
          Contact us to request a quote for your school.
        </p>

        <button
          onClick={handleContactSchools}
          className="inline-block bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
        >
          Request a School Quote
        </button>
      </div>
    </section>
  );
}
