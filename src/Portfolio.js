import React, { useState, useEffect, memo } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Terminal,
  Code,
  Server,
  GraduationCap,
  Award,
  Briefcase,
  Coffee,
  Globe,
  Clock,
  Brain,
  Users,
  Shield,
  PuzzleIcon,
  Cloud,
  Lightbulb,
  Rocket,
  Lock,
  Bot,
  Infinity
} from "lucide-react";

import ProfilePic from "./assets/ProfilePic.png";
import slackAppImage from "./assets/Project1.png";
import AI_ChatBot from "./assets/Project AI.jpg";
import Avocat_Dashboard from "./assets/Project Avocat2.png";
import Tutoring_Project from "./assets/Tutoring_Project.png";
import Graph_project from "./assets/ProjectGraph.png";

// Add StatCard component from the new code
const StatCard = ({ icon: Icon, value, label }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
);

// Add TabButton component
const TabButton = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            active
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
      {children}
    </button>
);

// Modified AboutSection component to match your styling
const AboutSection = () => {
  const [activeTab, setActiveTab] = useState('background');

  const stats = [
    { icon: Coffee, value: '1000+', label: 'Cups of Coffee' },
    { icon: Code, value: '15+', label: 'Projects Completed' },
    { icon: Clock, value: '2+', label: 'Years Experience' },
    { icon: Globe, value: '3', label: 'Languages Spoken' }
  ];

  const tabs = {
    background: {
      title: 'Background',
      content: (
          <div className="space-y-6">
            <p className="text-gray-600 leading-relaxed">
              As a passionate software engineer currently pursuing my degree at the Mediterranean Institute of Technology (MedTech),
              I have developed a strong foundation in full-stack development with a keen interest in AI, cloud computing, and cybersecurity.
              My journey in technology is driven by a desire to create innovative solutions that enhance security and leverage the power of the cloud.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Software Engineering Student</span>
                </div>
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Full Stack Developer</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Multiple Project Awards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Cybersecurity Enthusiast</span>
                </div>
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Cloud Computing Advocate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Innovative Problem Solver</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Team Collaboration Experience</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600"/>
                  <span className="font-medium">Freelance Experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-blue-600"/>
                  <span className="font-medium">AI and Machine Learning Projects</span>
                </div>
                <div className="flex items-center gap-3">
                  <PuzzleIcon className="w-5 h-5 text-blue-600"/>
                  <span className="font-medium">Passionate About Problem-Solving</span>
                </div>
              </div>
            </div>
          </div>
      )
    },
    contact: {
      title: 'Contact',
      content: (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Get in touch</h3>
                <p className="text-gray-600">
                  Feel free to reach out for collaborations or just a friendly hello
                </p>
                <div className="space-y-4">
                  <a
                      href="tel:+21641044635"
                      className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="w-5 h-5"/>
                    <span>+216 41 044 635</span>
                  </a>
                  <a
                      href="mailto:Mootez.aloui@medtech.tn"
                      className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Mail className="w-5 h-5"/>
                    <span>Mootez.aloui@medtech.tn</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Current Status</h3>
                <p className="text-gray-600">
                  Available for full-time positions and interesting projects in AI, cloud computing, and cybersecurity
                </p>
                <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = './assets/Mootez_Aloui_Resume_EN.pdf'
                      link.download = 'Mootez_Aloui_Resume.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Resume
                </button>
              </div>
            </div>
          </div>
      )
    }
  };

  return (
      <AnimatedSection>
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">About Me</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Building digital solutions with a focus on user experience and scalable architecture
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {stats.map((stat, index) => (
                  <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-wrap gap-4 mb-8">
                {Object.entries(tabs).map(([key, { title }]) => (
                    <TabButton
                        key={key}
                        active={activeTab === key}
                        onClick={() => setActiveTab(key)}
                    >
                      {title}
                    </TabButton>
                ))}
              </div>

              <div className="min-h-[300px]">
                {tabs[activeTab].content}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
  );
};
const TypewriterText = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(c => c + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{displayText}</span>;
};

const Header = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const skills = [
    { icon: <Terminal className="w-5 h-5" />, text: "Full Stack Development" },
    { icon: <Code className="w-5 h-5" />, text: "Clean Architecture" },
    { icon: <Server className="w-5 h-5" />, text: "Cloud Solutions" }
  ];

  return (
      <header className="relative min-h-screen flex flex-col justify-center bg-gray-900 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
              className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900"
              style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48ZyBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41Ij48cGF0aCBkPSJNMzAgMHYzME0wIDBoMzBNMzAgMzB2MzBNMzAgMGgzME0wIDMwaDMwTTMwIDYwaDMwIi8+PC9nPjwvZz48L3N2Zz4=')] animate-pulse" />
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="space-y-2">
                <h2 className="text-blue-400 font-medium">
                  <TypewriterText text="Hello, I'm" delay={100} />
                </h2>
                <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Mootez Aloui
                </h1>
                <div className="flex items-center space-x-2 text-xl text-gray-300">
                  <span className="font-medium">Software Engineer</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              <p className="text-gray-300 text-lg leading-relaxed">
                Passionate about crafting elegant solutions to complex problems.
                Specializing in full-stack development with a focus on scalable and maintainable applications, particularly in AI, cloud computing, and cybersecurity.
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-4">
                {skills.map((skill, index) => (
                    <div key={index}
                         className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                      {skill.icon}
                      <span className="text-sm font-medium">{skill.text}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Cloud className="w-5 h-5 text-blue-600"/>
                  <span className="text-sm font-medium">Cloud Solutions</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Infinity className="w-5 h-5 text-blue-600"/>
                  <span className="text-sm font-medium">DevOps</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Lock className="w-5 h-5 text-blue-600"/>
                  <span className="text-sm font-medium">Cybersecurity Practices</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Bot className="w-5 h-5 text-blue-600"/>
                  <span className="text-sm font-medium">AI Development</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <Brain className="w-5 h-5 text-blue-600"/>
                  <span className="text-sm font-medium">Machine Learning</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
              <a
                    href="./assets/Mootez_Aloui_Resume_EN.pdf"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
                >
                  View Resume <ExternalLink className="w-4 h-4"/>
                </a>
                <div className="flex gap-4">
                  <a
                      href="https://github.com/mootezaloui"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
                  >
                    <Github className="w-6 h-6" />
                  </a>
                  <a
                      href="https://www.linkedin.com/in/mootez-aloui-490090211"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a
                      href="mailto:Mootez.aloui@medtech.tn"
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
                  >
                    <Mail className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Profile Image */}
            <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative w-64 h-64 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse filter blur-xl opacity-50" />
                <div className="relative rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                  <img
                      src={ProfilePic}
                      alt="Mootez Aloui"
                      className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </header>
  );
};


// Animated Section Component
const AnimatedSection = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef) {
      observer.observe(elementRef);
    }

    return () => {
      if (elementRef) {
        observer.unobserve(elementRef);
      }
    };
  }, [elementRef]);

  return (
    <div
      ref={setElementRef}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
};


const ProjectCard = memo(({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
      <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
        {/* Main Card Content */}
        <div className="relative">
          {/* Image Section with Overlay */}
          <div className="relative h-64 overflow-hidden">
            <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Project Links - Appear on Hover */}
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

          {/* Content Section */}
          <div className="p-6">
            {/* Tags */}
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

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
              {project.title}
            </h3>
            <p className={`text-gray-600 text-sm leading-relaxed transition-all duration-500 ${
                isExpanded ? '' : 'line-clamp-2'
            }`}>
              {project.description}
            </p>

            {/* Expand Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              {isExpanded ? 'Show less' : 'Read more'}
              <ChevronRight
                  className={`w-4 h-4 transition-transform duration-300 ${
                      isExpanded ? 'rotate-90' : ''
                  }`}
              />
            </button>
          </div>

          {/* Expanded Content */}
          <div className={`px-6 overflow-hidden transition-all duration-500 ${
              isExpanded ? 'max-h-96 pb-6' : 'max-h-0'
          }`}>
            {/* Features Section */}
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

            {/* Technical Details */}
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
  const projects = [
    {
      title: "Equation Solver Chat Bot",
      description: "Built a chat bot using Python and Docker to solve mathematical equations, reducing manual computation time by 40% and improving accuracy.",
      image: AI_ChatBot,
      github: "https://github.com/mootezaloui/equation-solver-chatbot",
      demo: "https://www.linkedin.com/feed/update/urn:li:activity:7197166266959171585/",
      tags: ["Python", "Docker", "Vue.js"],
      features: [
        "Real-time equation solving",
        "User-friendly chat interface",
        "Integration with Docker for easy deployment"
      ],
      technicalDetails: "Utilized Python for backend processing, Docker for containerization, and Vue.js for the frontend interface."
    },
    {
      title: "Fire Propagation Simulation in Forests",
      description: "Developed a simulation using Python, Graph Theory, and Probability to optimize fire control strategies.",
      image: Graph_project,
      github: "https://github.com/Gathaa/GraphTheory",
      demo: "", // Add demo URL if available
      tags: ["Python", "Graph Theory", "Probability"],
      features: [
        "Realistic fire spread modeling",
        "Data visualization of simulation results",
        "Optimization algorithms for fire control"
      ],
      technicalDetails: "Implemented algorithms based on graph theory and probability to simulate fire behavior in various scenarios."
    },
    {
      title: "Management Software for Law Firm",
      description: "Developed a management system that cut legal file processing time by 40% using Node.js, Express, and MongoDB.",
      image: Avocat_Dashboard, // Ensure this variable is defined elsewhere or replace with a URL
      github: "https://github.com/mootezaloui/Avocat-Project",
      demo: "", // Add demo URL if available
      tags: ["Node.js", "Express", "PostgreSQL", "React"],
      features: [
        "Document management system",
        "Time tracking and billing features",
        "User-friendly interface for legal professionals"
      ],
      technicalDetails: "Built using a MERN stack, with Express for the backend API and React for the frontend interface."
    },
    {
      title: "Messenger-Live Messaging Application",
      description: "Developed a real-time messaging application similar to Slack using Node.js, React, and WebSocket.",
      image: slackAppImage, // Ensure this variable is defined elsewhere or replace with a URL
      github: "https://github.com/yassin014/softproject",
      demo: "", // Add demo URL if available
      tags: ["Node.js", "React", "WebSocket", "MongoDB"],
      features: [
        "Real-time messaging capabilities",
        "User authentication and profiles",
        "Channel creation and management"
      ],
      technicalDetails: "Leveraged WebSocket for real-time communication and MongoDB for data storage."
    },
    {
      title: "Tutoring Applications",
      description: "Developed a cross-platform tutoring app that connects students and tutors with live chat, scheduling tools, and resource access.",
      image: Tutoring_Project, // Ensure this variable is defined elsewhere or replace with a URL
      github: "https://github.com/mootezaloui/TutoringPROJECT",
      demo: "",
      tags: ["Node.js", "React", "React Native", "MySQL", "Express.js"],
      features: [
        "Live chat functionality between students and tutors",
        "Scheduling tools for easy appointment management",
        "Admin dashboard for data tracking and user management"
      ],
      technicalDetails: "Developed a cross-platform application using React Native for mobile and Node.js/Express for the backend."
    }
  ];

  return (

      <section className="py-20 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-5">
            Featured Projects
          </h2>
          <p className="text-gray-600 text-center mb-12">
            A simple overview of my Academic and Personal Projects.
          </p>
          <AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
                <ProjectCard key={index} project={project} index={index}/>
            ))}
          </div>
          </AnimatedSection>
        </div>
      </section>

  );
};

// Experience Timeline Component
const ExperienceTimeline = ({
                              title,
                              company,
                              period,
                              achievements,
  isRight,
}) => (
  <div
    className={`relative w-full md:w-1/2 ${isRight ? "md:pl-12" : "md:pr-12"}`}
  >
    {/* Marker */}
    <div
      className={`absolute top-0 w-4 h-4 bg-blue-600 rounded-full shadow-md ${
        isRight
          ? "left-0 md:left-auto md:right-0"
          : "left-auto right-0 md:left-0"
      }`}
    ></div>
    {/* Timeline Line (hidden on smaller screens) */}
    <div
      className={`hidden md:block absolute w-0.5 h-full bg-blue-300 ${
        isRight ? "left-0" : "right-0"
      }`}
    ></div>

    <div className={`ml-8 ${isRight ? "md:ml-0 md:mr-8" : "md:mr-0"}`}>
      {/* Title and Company */}
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">
        {company} | {period}
      </p>
      {/* Achievements List */}
      <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
        {achievements.map((achievement, index) => (
          <li key={index}>{achievement}</li>
        ))}
      </ul>
    </div>
  </div>
);

// Experience Section - Center Timeline with Alternating Layout
const ExperienceSection = () => {

  const experiences = [
    {
      title: "Software Engineer Intern",
      company: "RedStart",
      period: "May 2024 - Present",
      achievements: [
        "Engineered and deployed a web application with integrated cyber security and AI features, enhancing data protection for over 500 users.",
        "Boosted system reliability by 20% through innovative cloud computing solutions using Python, Django, and AWS.",
        "Led a collaborative effort to optimize backend services with Docker, resulting in a more secure and efficient system.",
      ],
    },
    {
      title: "Freelancer",
      company: "Law Firm",
      period: "June 2022 - Jan 2024",
      achievements: [
        "Developed management software using Node.js and MongoDB that reduced legal file processing time by 40%, significantly improving efficiency.",
        "Increased client satisfaction by 30% by creating a user-friendly interface and providing ongoing compliance support.",
        "Integrated Express.js for smooth data flow and enhanced user experience across the platform.",
      ],
    },
    {
      title: "Junior Student Intern",
      company: "Carrier",
      period: "Summer 2022",
      achievements: [
        "Contributed to the design and testing of HVAC systems using AutoCAD and MATLAB, gaining practical engineering experience.",
        "Supported optimization efforts in system design, reducing production times by 15%.",
      ],
    },
    {
      title: "Apple Developer & Tester",
      company: "Apple",
      period: "Sept 2021 - Present",
      achievements: [
        "Optimized iOS to enhance user experience and performance, leading to increased user engagement.",
        "Collaborated with global teams to ensure high code quality and seamless feature launches using Swift and Xcode.",
      ],
    },
    {
      title: "Library Officer",
      company: "SMU",
      period: "Sept 2021 - Present",
      achievements: [
        "Organized academic events and streamlined resource management, increasing student engagement by 25%.",
        "Implemented digital systems that improved library service efficiency by 20%.",
      ],
    },
    {
      title: "Sponsoring Manager",
      company: "IEEE SMU Student Branch",
      period: "Dec 2020 - Dec 2022",
      achievements: [
        "Led a team of 15, securing over $10,000 in sponsorship and organizing conferences that boosted technical skills and networking opportunities for students.",
        "Implemented effective fundraising strategies, surpassing financial targets by 15%.",
      ],
    },
    {
      title: "Member",
      company: "Tunis Mediterranean Rotaract",
      period: "Mar 2020 - Nov 2023",
      achievements: [
        "Contributed to over 10 humanitarian projects, positively impacting over 200 individuals through community development initiatives.",
        "Led efforts in service projects, enhancing the organization's impact on local communities.",
      ],
    },
    {
      title: "Admission's Officer Intern",
      company: "SMU",
      period: "Summer 2021",
      achievements: [
        "Supported the recruitment and onboarding processes, leading to a 15% increase in student applications.",
        "Streamlined administrative workflows using CRM software and MS Office, improving operational efficiency by 20%.",
      ],
    },
  ];

  return (
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Work Experience</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A comprehensive overview of my work experience and professional learning.
            </p>

            <AnimatedSection>
              <div className="relative px-4 py-8 bg-gray-50">
                {/* Center Timeline */}
                <div className="relative max-w-5xl mx-auto">
                  {/* Vertical Timeline Line */}
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-300"></div>

                  {experiences.map((experience, index) => (
                      <div
                          key={index}
                          className="flex flex-col md:flex-row items-start mb-12"
                      >
                        {/* Alternate experiences between left and right */}
                        {index % 2 === 0 ? (
                            <>
                              {/* Left Side */}
                              <ExperienceTimeline
                                  title={experience.title}
                                  company={experience.company}
                                  period={experience.period}
                                  achievements={experience.achievements}
                                  isRight={false}
                              />
                              {/* Empty space for right alignment */}
                              <div className="hidden md:block w-1/2"></div>
                            </>
                        ) : (
                            <>
                              {/* Empty space for left alignment */}
                              <div className="hidden md:block w-1/2"></div>
                              {/* Right Side */}
                              <ExperienceTimeline
                                  title={experience.title}
                                  company={experience.company}
                                  period={experience.period}
                                  achievements={experience.achievements}
                                  isRight={true}
                              />
                            </>
                        )}
                      </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
  );
};

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const skillCategories = [
    {
      id: 'languages',
      icon: Code,
      title: 'Programming Languages',
      skills: [
        { name: 'Python', level: 90, years: 3 },
        { name: 'JavaScript', level: 85, years: 2 },
        { name: 'TypeScript', level: 75, years: 1 },
        { name: 'Java', level: 70, years: 2 },
        { name: 'SQL', level: 80, years: 2 }
      ]
    },
    {
      id: 'frontend',
      icon: Globe,
      title: 'Frontend Development',
      skills: [
        { name: 'React', level: 85, years: 2 },
        { name: 'Vue.js', level: 75, years: 1 },
        { name: 'HTML/CSS', level: 90, years: 3 },
        { name: 'Tailwind CSS', level: 85, years: 2 },
        { name: 'Next.js', level: 70, years: 1 }
      ]
    },
    {
      id: 'backend',
      icon: Server,
      title: 'Backend Development',
      skills: [
        { name: 'Node.js', level: 80, years: 2 },
        { name: 'Express.js', level: 85, years: 2 },
        { name: 'MongoDB', level: 75, years: 2 },
        { name: 'PostgreSQL', level: 70, years: 1 },
        { name: 'RESTful APIs', level: 85, years: 2 }
      ]
    },
    {
      id: 'tools',
      icon: Briefcase,
      title: 'Tools & Practices',
      skills: [
        { name: 'Git', level: 90, years: 3 },
        { name: 'Docker', level: 75, years: 1 },
        { name: 'AWS', level: 70, years: 1 },
        { name: 'CI/CD', level: 80, years: 2 },
        { name: 'Agile/Scrum', level: 85, years: 2 }
      ]
    },
    {
      id: 'soft',
      icon: Users,
      title: 'Soft Skills',
      skills: [
        { name: 'Team Leadership', level: 85, years: 2 },
        { name: 'Problem Solving', level: 90, years: 3 },
        { name: 'Communication', level: 85, years: 3 },
        { name: 'Project Management', level: 80, years: 2 },
        { name: 'Mentoring', level: 75, years: 1 }
      ]
    },
    {
      id: 'ai',
      icon: Brain,
      title: 'AI & ML',
      skills: [
        { name: 'Machine Learning', level: 75, years: 1 },
        { name: 'TensorFlow', level: 70, years: 1 },
        { name: 'Data Analysis', level: 80, years: 2 },
        { name: 'NLP', level: 70, years: 1 },
        { name: 'Computer Vision', level: 65, years: 1 }
      ]
    }
  ];

  const getSkillLevelColor = (level) => {
    if (level >= 85) return 'bg-green-500';
    if (level >= 70) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  return (

      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Technical Expertise</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A comprehensive overview of my technical skills and professional competencies,
              developed through practical experience and continuous learning.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
                onClick={() => setActiveCategory('all')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 
              ${activeCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              All Skills
            </button>
            {skillCategories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2
                ${activeCategory === category.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.title}
                </button>
            ))}
          </div>
          <AnimatedSection>

          {/* Skills Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories
                .filter(category => activeCategory === 'all' || category.id === activeCategory)
                .map((category) => (
                    <div key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white rounded-lg">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <category.icon className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-lg">{category.title}</h3>
                        </div>

                        <div className="space-y-4">
                          {category.skills.map((skill) => (
                              <div key={skill.name} className="group">
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium text-gray-700">{skill.name}</span>
                                  <span className="text-sm text-gray-500">{skill.years} years</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                      className={`h-full ${getSkillLevelColor(skill.level)} transition-all duration-500 group-hover:opacity-80`}
                                      style={{ width: `${skill.level}%` }}
                                  />
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                ))}
          </div>
          </AnimatedSection>
        </div>
      </section>


  );
};

// Main Portfolio Component
const Portfolio = () => {
  return (
      <div className="min-h-screen bg-white">
        <Header />
        <AboutSection />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
      <AnimatedSection>
        <section className="py-20 px-8 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>
            <p className="mb-8">
              Currently available for software engineering positions and
              interesting projects.
            </p>
            <a
              href="mailto:Mootez.aloui@medtech.tn"
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors transform hover:scale-105 duration-300"
            >
              Contact Me
            </a>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default Portfolio;
