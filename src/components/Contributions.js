import React from 'react';
import { GitPullRequest, GitMerge, Users, Star } from 'lucide-react';

const ContributionsSection = () => {
  const contributions = [
    {
      title: "Open Source Projects",
      stats: [
        { icon: GitPullRequest, value: "50+", label: "Pull Requests" },
        { icon: GitMerge, value: "30+", label: "Merged PRs" },
        { icon: Users, value: "10+", label: "Projects" },
        { icon: Star, value: "100+", label: "Stars Received" }
      ],
      description: "Active contributor to various open source projects, focusing on improving documentation, fixing bugs, and implementing new features."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Open Source Contributions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Actively contributing to the open source community and making a difference in the software development ecosystem.
          </p>
        </div>

        <div className="space-y-8">
          {contributions.map((contribution, index) => (
            <div
              key={index}
              className="border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">{contribution.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {contribution.stats.map((stat, statIndex) => (
                  <div
                    key={statIndex}
                    className="bg-gray-50 p-4 rounded-lg text-center"
                  >
                    <stat.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600">{contribution.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContributionsSection;
