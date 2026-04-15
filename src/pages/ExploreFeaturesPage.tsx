import React from 'react';
import { Clock, BookOpen, Settings, Download, Lightbulb, History, Target, FileText, Users, Gauge, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ExploreFeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: "Plans Ready in Seconds",
      description: "Stop spending hours on planning. Get a complete, structured plan in seconds — freeing up your evenings and weekends."
    },
    {
      icon: BookOpen,
      title: "UK National Curriculum Aligned",
      description: "Every plan is built to the UK National Curriculum for primary — reliable, accurate, and ready to use without revision."
    },
    {
      icon: Settings,
      title: "Fully Editable Output",
      description: "Edit any section of your plan to fit your class, your school's format, or your own teaching preferences."
    },
    {
      icon: Download,
      title: "PDF & Word Export",
      description: "Download your plans in PDF or DOCX format — ready to print or drop straight into your planning folder."
    },
    {
      icon: Lightbulb,
      title: "Activity & Resource Ideas",
      description: "Each plan comes with practical suggestions for activities, resources, and materials to enrich your teaching."
    },
    {
      icon: History,
      title: "Plan History",
      description: "Access all your previously generated plans at any time — review, re-download, or use as a starting point."
    },
    {
      icon: Target,
      title: "Differentiation Built In",
      description: "Support and extension guidance is included in every plan so every pupil in your class is accounted for."
    },
    {
      icon: FileText,
      title: "Assessment Criteria Included",
      description: "Each plan includes assessment checkpoints and success criteria aligned to the lesson objectives."
    },
    {
      icon: Gauge,
      title: "Flexible Monthly Lesson Plan Limits",
      description: "Starter: 30 lesson plans per month, Standard: 90 lesson plans per month, Pro: Unlimited lesson plans per month. Choose the plan that fits your teaching workload."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-cyan-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
              Everything Inside
              <span className="text-[#4CAF50] block mt-2">LessonLift</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Specialist planning tools built for UK primary teachers — designed to save time, support every pupil, and produce quality output from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-[#4CAF50] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-[#4CAF50] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Demonstration Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              See It in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how these tools work together to give UK primary teachers fast, high-quality planning output.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Highlights */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Plans in Seconds</h3>
                  <p className="text-gray-600">A complete, structured plan delivered in seconds — saving you hours across the week.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Curriculum Aligned</h3>
                  <p className="text-gray-600">Every plan maps to the UK National Curriculum for primary — accurate and ready to use.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy to Adapt</h3>
                  <p className="text-gray-600">Every section is editable — tweak it to suit your class, your school, or your own approach.</p>
                </div>
              </div>
            </div>

            {/* Visual Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border">
                {/* Header */}
                <div className="bg-[#4CAF50] px-6 py-4">
                  <h3 className="text-white font-semibold text-lg">LessonLift Dashboard</h3>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Year 4 Mathematics</span>
                    </div>
                    <span className="text-sm text-gray-500">Generated in 28s</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Science - Plants</span>
                    </div>
                    <span className="text-sm text-gray-500">Generated in 31s</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">English - Creative Writing</span>
                    </div>
                    <span className="text-sm text-gray-500">Generated in 25s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Planning Smarter?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe today and give yourself back hours of planning time every week.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="/signup" className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2">
              <span>Subscribe Now</span>
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ExploreFeaturesPage;