import React from 'react';
import { Building, Calendar, ChevronRight, Briefcase } from 'lucide-react';
import experiencesData from "../data/experiences.json";

const ExperienceCard = ({ title, company, period, achievements }) => (
  <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300">
    {/* Accent line */}
    <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <div className="flex items-center mt-1 text-slate-500">
          <Building className="w-4 h-4 mr-2" />
          <span className="text-sm">{company}</span>
        </div>
      </div>
      <div className="flex items-center text-slate-400 bg-slate-50 px-3 py-1 rounded">
        <Calendar className="w-4 h-4 mr-2" />
        <span className="text-sm whitespace-nowrap">{period}</span>
      </div>
    </div>

    {/* Achievements */}
    <ul className="space-y-3 relative">
      {achievements.map((achievement, index) => (
        <li 
          key={index} 
          className="pl-6 relative text-slate-600 text-sm leading-relaxed before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-600 before:rounded-full"
        >
          {achievement}
        </li>
      ))}
    </ul>
    
    {/* Hover indicator */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <ChevronRight className="w-5 h-5 text-blue-600" />
    </div>
  </div>
);

const ExperienceSection = () => {
  const { experiences } = experiencesData;

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-slate-800">Work Experience</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A comprehensive overview of my work experience and professional learning.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative space-y-6">
          {/* Center line - visible on medium and larger screens */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" />

          {experiences.map((experience, index) => (
            <div key={index} className="relative">
              {/* Date marker - visible on medium and larger screens */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 z-10">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
              </div>
              
              {/* Experience card with alternating layout */}
              <div className={`md:w-1/2 ${
                index % 2 === 0 
                  ? 'md:pr-12 md:mr-auto' 
                  : 'md:pl-12 md:ml-auto'
              }`}>
                <ExperienceCard {...experience} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;