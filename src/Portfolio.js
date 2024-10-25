import React, { useState, useEffect } from "react";
import {
  Github,
  Linkedin,
  Mail,
  Phone,
  ExternalLink,
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
  Infinity,
} from "lucide-react";

import SkillsSection from "./components/Skills";
import ProjectsSection from "./components/Projects";
import ExperienceSection from "./components/Experiences";
import ContributionsSection from "./components/Contributions";
import CertificationsSection from "./components/Certifications";

import ProfilePic from "./assets/ProfilePic.png";


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
        ? "bg-blue-600 text-white shadow-lg"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

const handleResumeDownload = () => {
  // Direct path to the resume file in public folder
  const resumePath = "./assets/Mootez_Aloui_Resume_EN.pdf";

  fetch(resumePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Resume file not found");
      }
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "Mootez_Aloui_Resume_EN.pdf";

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch((error) => {
      console.error("Error downloading resume:", error);
      alert("Unable to download resume. Please try again later.");
    });
};

// Modified AboutSection component to match your styling
const AboutSection = () => {
  const [activeTab, setActiveTab] = useState("background");

  const stats = [
    { icon: Coffee, value: "1000+", label: "Cups of Coffee" },
    { icon: Code, value: "15+", label: "Projects Completed" },
    { icon: Clock, value: "2+", label: "Years Experience" },
    { icon: Globe, value: "3", label: "Languages Spoken" },
  ];

  const tabs = {
    background: {
      title: "Background",
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 leading-relaxed">
            As a passionate software engineer currently pursuing my degree at
            the Mediterranean Institute of Technology (MedTech), I have
            developed a strong foundation in full-stack development with a keen
            interest in AI, cloud computing, and cybersecurity. My journey in
            technology is driven by a desire to create innovative solutions that
            enhance security and leverage the power of the cloud.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span className="font-medium">
                  Software Engineering Student
                </span>
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
                <span className="font-medium">
                  Team Collaboration Experience
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Freelance Experience</span>
              </div>
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-blue-600" />
                <span className="font-medium">
                  AI and Machine Learning Projects
                </span>
              </div>
              <div className="flex items-center gap-3">
                <PuzzleIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium">
                  Passionate About Problem-Solving
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    contact: {
      title: "Contact",
      content: (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Get in touch</h3>
              <p className="text-gray-600">
                Feel free to reach out for collaborations or just a friendly
                hello
              </p>
              <div className="space-y-4">
                <a
                  href="tel:+21641044635"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>+216 41 044 635</span>
                </a>
                <a
                  href="mailto:Mootez.aloui@medtech.tn"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>Mootez.aloui@medtech.tn</span>
                </a>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Current Status</h3>
              <p className="text-gray-600">
                Available for full-time positions and interesting projects in
                AI, cloud computing, and cybersecurity
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleResumeDownload}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
                >
                  Download Resume <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <AnimatedSection>
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About Me</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Building digital solutions with a focus on user experience and
              scalable architecture
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

            <div className="min-h-[300px]">{tabs[activeTab].content}</div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};
const TypewriterText = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((c) => c + 1);
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const skills = [
    { icon: <Terminal className="w-5 h-5" />, text: "Full Stack Development" },
    { icon: <Code className="w-5 h-5" />, text: "Clean Architecture" },
    { icon: <Server className="w-5 h-5" />, text: "Cloud Solutions" },
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
          <div
            className={`space-y-6 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10"
            }`}
          >
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
              Specializing in full-stack development with a focus on scalable
              and maintainable applications, particularly in AI, cloud
              computing, and cybersecurity.
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-4">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm"
                >
                  {skill.icon}
                  <span className="text-sm font-medium">{skill.text}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <Cloud className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Cloud Solutions</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <Infinity className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">DevOps</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">
                  Cybersecurity Practices
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <Bot className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">AI Development</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Machine Learning</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="./assets/Mootez_Aloui_Resume_EN.pdf"
                download="Mootez_Aloui_Resume_EN.pdf"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-300 flex items-center gap-2"
              >
                View Resume <ExternalLink className="w-4 h-4" />
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
          <div
            className={`relative transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
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


// Main Portfolio Component
const Portfolio = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AboutSection />
      <AnimatedSection>
      <ProjectsSection />
      </AnimatedSection>
      <AnimatedSection>
      <ExperienceSection />
      </AnimatedSection>
      <AnimatedSection>
      <SkillsSection />
      </AnimatedSection>
      <AnimatedSection>
      <CertificationsSection />
      </AnimatedSection>
      <AnimatedSection>
      <ContributionsSection/>
      </AnimatedSection>
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
