import React, { useState } from "react";
import { Code, Server, Brain, Globe, Briefcase, Users, Cloud, Shield } from "lucide-react";
import skillsData from "../data/skills.json";

const iconMap = {
  Code: Code,
  Globe: Globe,
  Server: Server,
  Briefcase: Briefcase,
  Users: Users,
  Brain: Brain,
  Shield: Shield,
  Cloud: Cloud,
};

const skillCategories = skillsData.skillCategories.map((category) => ({
  ...category,
  icon: iconMap[category.icon], // Resolve the icon component
}));

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const getSkillLevelColor = (level) => {
    if (level >= 85) return "bg-green-500";
    if (level >= 70) return "bg-blue-500";
    return "bg-purple-500";
  };

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Technical Expertise</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A comprehensive overview of my technical skills and professional
            competencies, developed through practical experience and continuous
            learning.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 
              ${
                activeCategory === "all"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
          >
            All Skills
          </button>
          {skillCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2
                ${
                  activeCategory === category.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              <category.icon className="w-4 h-4" />
              {category.title}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillCategories
            .filter(
              (category) =>
                activeCategory === "all" || category.id === activeCategory
            )
            .map((category) => (
              <div
                key={category.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white rounded-lg"
              >
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
                          <span className="font-medium text-gray-700">
                            {skill.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {skill.years} years
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getSkillLevelColor(
                              skill.level
                            )} transition-all duration-500 group-hover:opacity-80`}
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
      </div>
    </section>
  );
};

export default SkillsSection;
