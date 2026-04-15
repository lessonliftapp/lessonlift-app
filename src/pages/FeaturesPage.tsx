import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Settings, Download, Lightbulb, Headphones as HeadphonesIcon, ArrowRight, Play, Zap, Target, FileText, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: "Plans Generated in Seconds",
      description: "Stop spending evenings planning. Get a complete, structured lesson plan in seconds and reclaim hours each week."
    },
    {
      icon: BookOpen,
      title: "UK National Curriculum Aligned",
      description: "Every plan is built around the UK National Curriculum for primary — so you can trust the output without double-checking."
    },
    {
      icon: Settings,
      title: "Fully Editable Output",
      description: "Every plan is yours to adapt. Edit any section to suit your teaching style, class needs, or school format."
    },
    {
      icon: Download,
      title: "PDF & Word Export",
      description: "Download your plans as PDF or DOCX — ready to print, share, or drop straight into your planning folder."
    },
    {
      icon: Lightbulb,
      title: "Activity & Resource Ideas",
      description: "Each plan includes practical activity suggestions and resource ideas to enrich your teaching."
    },
    {
      icon: HeadphonesIcon,
      title: "Responsive Support",
      description: "Get help when you need it from a support team that understands how teachers work."
    },
    {
      icon: Target,
      title: "Differentiation Built In",
      description: "Plans include support and extension suggestions so every pupil is catered for — without extra effort."
    },
    {
      icon: FileText,
      title: "Assessments Included",
      description: "Each plan comes with assessment criteria aligned to the lesson objectives — formative checkpoints included."
    },
    {
      icon: Users,
      title: "Share With Colleagues",
      description: "Export and share your plans with year group partners or use them as a starting point for collaborative planning."
    },
    {
      icon: Zap,
      title: "Consistent Structure Every Time",
      description: "Every output follows a clear, professional format — making your planning folder tidy and your CPD portfolio stronger."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Built for UK Primary Teachers.
              <span className="text-[#4CAF50] block mt-2">Designed Around Your Day.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Curriculum-aligned planning tools that save time, support differentiation, and produce high-quality output — every single time.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What LessonLift Gives You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is designed around how UK primary teachers actually work — saving time while raising the quality of your planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Plan Smarter?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join UK primary teachers who are spending less time planning and more time teaching.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/signup" className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
              <span>Subscribe Now</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;