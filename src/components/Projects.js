import React, { useState, memo } from 'react';
import { Github, ExternalLink, ChevronRight } from 'lucide-react';
import projectsData from '../data/projects.json'

// Import images
import slackAppImage from '../assets/Project1.png';
import AI_ChatBot from '../assets/Project AI.jpg';
import Avocat_Dashboard from '../assets/Project Avocat2.png';
import Tutoring_Project from '../assets/Tutoring_Project.png';
import Graph_project from '../assets/ProjectGraph.png';

// Mapping project names to imported images
const imageMapping = {
  'AI_ChatBot': AI_ChatBot,
  'Graph_project': Graph_project,
  'Avocat_Dashboard': Avocat_Dashboard,
  'slackAppImage': slackAppImage,
  'Tutoring_Project': Tutoring_Project,
};

// ProjectCard Component
const ProjectCard = memo(({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
      <div className="relative">
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageMapping[project.image]} // Use the mapping for the image source
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute bottom-4 left-4 right-4 flex justify-end gap-3 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-900 hover:bg-white transition-colors duration-300"
              >
                <Github className="w-4 h-4" />
                <span>Code</span>
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
            {project.title}
          </h3>
          <p
            className={`text-gray-600 text-sm leading-relaxed transition-all duration-500 ${
              isExpanded ? "" : "line-clamp-2"
            }`}
          >
            {project.description}
          </p>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
          >
            {isExpanded ? "Show less" : "Read more"}
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>

        <div
          className={`px-6 overflow-hidden transition-all duration-500 ${
            isExpanded ? "max-h-96 pb-6" : "max-h-0"
          }`}
        >
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Key Features</h4>
            <ul className="space-y-2">
              {project.features?.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-gray-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {project.technicalDetails && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Technical Details</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {project.technicalDetails}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ProjectsSection = () => {
  const { projects } = projectsData; // Access projects from JSON

  return (
    <section className="py-20 px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-5">Featured Projects</h2>
        <p className="text-gray-600 text-center mb-12">
          A simple overview of my Academic and Personal Projects.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
