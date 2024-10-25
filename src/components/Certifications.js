import React, { useState } from 'react';
import { Award, Code, ExternalLink, Calendar, Building, BookOpen, ChevronRight } from 'lucide-react';
import certificationsData from '../data/certifications.json';

const CertificationsSection = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const certifications = certificationsData.certifications;

  const handleSeeMore = () => {
    setVisibleCount(visibleCount + 6);
  };

  const handleLinkedInClick = () => {
    window.open('https://www.linkedin.com/in/mootez-aloui-490090211/details/certifications/', '_blank');
  };

  // Function to generate a background gradient based on the certification title
  const generateGradient = (title) => {
    const hue = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
    return `linear-gradient(135deg, hsl(${hue}, 70%, 90%) 0%, hsl(${(hue + 40) % 360}, 70%, 85%) 100%)`;
  };

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Certifications</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Professional certifications and achievements. View my complete profile on LinkedIn.
          </p>
          <button
            onClick={handleLinkedInClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on LinkedIn
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.slice(0, visibleCount).map((cert, index) => (
            <div 
              key={index}
              className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {/* Gradient Header */}
              <div 
                className="h-24 w-full relative"
                style={{ background: generateGradient(cert.title) }}
              >
                <Award className="absolute right-4 top-4 w-12 h-12 text-white/50" />
              </div>
              
              {/* Title Section */}
              <div className="relative -mt-8 px-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{cert.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    {cert.issuer}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Issued {cert.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span>ID: {cert.credentialId}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {cert.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-4">
                <button className="w-full group-hover:bg-blue-50 py-2 rounded-md flex items-center justify-center text-blue-600 text-sm transition-colors">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Certificate
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {visibleCount < certifications.length && (
          <div className="text-center mt-8">
            <button
              onClick={handleSeeMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              See More Certifications
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CertificationsSection;