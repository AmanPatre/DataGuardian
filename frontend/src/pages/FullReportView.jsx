import Header from "../components/Header";
import ToggleAction from "../components/ToggleAction";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  ArrowLeftIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
  WifiIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Network Visualization Component
const TrackerNetworkVisualization = ({ 
  url = "https://example.com", 
  trackerDetails = [], 
  aiSummary = null,
  trackerCount = 0 
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Process tracker data for visualization
  const processTrackerData = () => {
    const hostname = new URL(url).hostname;
    
    // Create central website node
    const nodes = [{
      id: hostname,
      type: 'website',
      category: 'website',
      company: hostname,
      x: 0,
      y: 0,
      size: 16
    }];

    // Process tracker details or create sample data
    const trackers = trackerDetails.length > 0 ? trackerDetails.slice(0, 12) : [
      { company: 'Google Analytics', category: 'Analytics', domain: 'google-analytics.com' },
      { company: 'Facebook Pixel', category: 'Advertising', domain: 'facebook.com' },
      { company: 'Hotjar', category: 'Analytics', domain: 'hotjar.com' },
      { company: 'Amazon CDN', category: 'CDN/Utility', domain: 'cloudfront.net' },
      { company: 'Twitter Widget', category: 'Social', domain: 'twitter.com' },
      { company: 'Salesforce', category: 'Other', domain: 'salesforce.com' }
    ];

    // Color mapping for categories
    const categoryColors = {
      'website': '#3b82f6',
      'Advertising': '#ef4444',
      'Analytics': '#10b981',
      'Tag Manager': '#f59e0b',
      'CDN/Utility': '#8b5cf6',
      'Social': '#f97316',
      'First-Party/Analytics': '#06b6d4',
      'Other': '#6b7280'
    };

    // Add tracker nodes
    trackers.forEach((tracker, index) => {
      nodes.push({
        id: `${tracker.company}-${index}`,
        type: 'tracker',
        category: tracker.category || 'Other',
        company: tracker.company,
        domain: tracker.domain || 'unknown.com',
        size: 10,
        color: categoryColors[tracker.category] || categoryColors['Other']
      });
    });

    // Create links from website to all trackers
    const links = [];
    trackers.forEach((tracker, index) => {
      links.push({
        source: hostname,
        target: `${tracker.company}-${index}`,
        type: 'data-flow'
      });
    });

    return { nodes, links, categoryColors };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current?.clientWidth || 320;
    const width = Math.min(containerWidth, 350);
    const height = 280;

    svg.attr("width", width).attr("height", height);

    const { nodes, links, categoryColors } = processTrackerData();

    // Create defs for gradients and filters
    const defs = svg.append("defs");

    // Gradient for website node
    const websiteGradient = defs.append("radialGradient")
      .attr("id", "websiteGradient");
    websiteGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#60a5fa");
    websiteGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6");

    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.size + 2));

    // Create link elements
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", "5,3");

    // Create particle system for data flow
    const particles = svg.append("g").attr("class", "particles");

    // Create nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => d.type === 'website' ? "url(#websiteGradient)" : d.color)
      .attr("stroke", d => d.type === 'website' ? "#1e40af" : "#ffffff")
      .attr("stroke-width", d => d.type === 'website' ? 3 : 2)
      .attr("filter", d => d.type === 'website' ? "url(#glow)" : "none");

    // Add labels to nodes
    node.append("text")
      .attr("dy", d => d.type === 'website' ? 25 : 18)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", d => d.type === 'website' ? "bold" : "normal")
      .style("fill", d => d.type === 'website' ? "#1e40af" : "#374151")
      .text(d => {
        if (d.type === 'website') {
          return d.company.length > 15 ? d.company.substring(0, 15) + "..." : d.company;
        }
        return d.company.length > 12 ? d.company.substring(0, 12) + "..." : d.company;
      });

    // Add category labels for trackers
    node.filter(d => d.type === 'tracker')
      .append("text")
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .style("fill", "#6b7280")
      .text(d => d.category);

    // Animation for particles along links
    const animateParticles = () => {
      links.forEach((linkData, i) => {
        if (Math.random() < 0.3) { // 30% chance for particle
          const sourceNode = nodes.find(n => n.id === linkData.source.id || n.id === linkData.source);
          const targetNode = nodes.find(n => n.id === linkData.target.id || n.id === linkData.target);
          
          if (sourceNode && targetNode) {
            const particle = particles.append("circle")
              .attr("r", 2)
              .attr("fill", "#ef4444")
              .attr("opacity", 0.8)
              .attr("cx", sourceNode.x)
              .attr("cy", sourceNode.y);

            particle.transition()
              .duration(2000)
              .attr("cx", targetNode.x)
              .attr("cy", targetNode.y)
              .attr("opacity", 0)
              .remove();
          }
        }
      });
    };

    // Mouse interactions
    node
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", d.size * 1.3)
          .attr("stroke-width", d.type === 'website' ? 4 : 3);
      })
      .on("mouseout", (event, d) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", d.size)
          .attr("stroke-width", d.type === 'website' ? 3 : 2);
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Start particle animation interval
    const particleInterval = setInterval(animateParticles, 1500);

    // Cleanup
    return () => {
      clearInterval(particleInterval);
      simulation.stop();
    };
  }, [url, trackerDetails, aiSummary]);

  const { categoryColors } = processTrackerData();
  const uniqueCategories = [...new Set(trackerDetails.map(t => t.category || 'Other'))];

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="w-full border border-gray-200 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50"></svg>
      
      {/* Tooltip */}
      {hoveredNode && (
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border text-xs max-w-48">
          <div className="font-semibold text-gray-900">{hoveredNode.company}</div>
          <div className="text-gray-600">{hoveredNode.category}</div>
          {hoveredNode.type === 'website' && (
            <div className="text-blue-600 mt-1">Central Website</div>
          )}
          {hoveredNode.type === 'tracker' && (
            <div>
              <div className="text-red-600 mt-1">Receives Your Data</div>
              <div className="text-gray-500 text-xs mt-1 font-mono">{hoveredNode.domain}</div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <span className="text-gray-600">Website</span>
        </div>
        {uniqueCategories.slice(0, 7).map(category => (
          <div key={category} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: categoryColors[category] || categoryColors['Other'] }}
            ></div>
            <span className="text-gray-600 truncate">
              {category === 'First-Party/Analytics' ? 'FP Analytics' : category}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-2 text-xs text-center text-gray-500">
        <span className="inline-flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          Live data flow visualization • {trackerCount || trackerDetails.length} trackers
        </span>
      </div>
    </div>
  );
};



const FullReportView = ({ siteData = {}, onNavigate }) => {
  const {
    score = "N/A",
    grade = "F",
    url = "Unknown site",
    simplifiedPolicy = "",
    trackerCount = 0,
    aiSummary = null,
    permissions = { notifications: false, cookies: false },
  } = siteData;

  const hasAISummary = aiSummary && aiSummary.success && aiSummary.summary;

  // Prepare data for radial tracker chart
  const trackerDetails = aiSummary?.trackerDetails || [];
  const categoryOrder = [
    "Advertising",
    "Analytics",
    "Tag Manager",
    "CDN/Utility",
    "Social",
    "First-Party/Analytics",
    "Other",
  ];
  const categoryColors = {
    Advertising: "#f59e0b", // amber-500
    Analytics: "#3b82f6", // blue-500
    "Tag Manager": "#14b8a6", // teal-500
    "CDN/Utility": "#8b5cf6", // violet-500
    Social: "#ef4444", // red-500
    "First-Party/Analytics": "#16a34a", // green-600
    Other: "#6b7280", // gray-500
  };
  const categoryCounts = categoryOrder.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  trackerDetails.forEach((t) => {
    const key =
      categoryOrder.find((c) =>
        (t.category || "Other").toLowerCase().includes(c.toLowerCase())
      ) || "Other";
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  // Company counts per category (for tooltips)
  const categoryCompanies = categoryOrder.reduce((acc, c) => {
    acc[c] = {};
    return acc;
  }, {});
  trackerDetails.forEach((t) => {
    const categoryKey =
      categoryOrder.find((c) =>
        (t.category || "Other").toLowerCase().includes(c.toLowerCase())
      ) || "Other";
    const company = t.company || "Unknown";
    categoryCompanies[categoryKey][company] =
      (categoryCompanies[categoryKey][company] || 0) + 1;
  });

  const radialData = categoryOrder.map((c) => {
    const companiesMap = categoryCompanies[c] || {};
    const companies = Object.entries(companiesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    return {
      category: c,
      count: categoryCounts[c] || 0,
      color: categoryColors[c],
      companies,
    };
  });

  // D3 radial chart setup
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const d3Data = useMemo(() => radialData, [radialData]);

  useEffect(() => {
    const container = d3.select(containerRef.current);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const containerWidth = containerRef.current?.clientWidth || 320;
    const size = Math.min(Math.max(containerWidth - 24, 260), 360);
    const width = size;
    const height = size;
    const cx = width / 2;
    const cy = height / 2;
    const inner = size * 0.2;
    const maxLen = size * 0.42;
    const total = d3Data.length;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.attr("width", width).attr("height", height);

    // defs: gradient ring and glow
    const defs = svg.append("defs");
    const grad = defs.append("radialGradient").attr("id", "ringGrad");
    grad.append("stop").attr("offset", "0% ").attr("stop-color", "#fde68a");
    grad.append("stop").attr("offset", "100% ").attr("stop-color", "#f59e0b");
    const glow = defs.append("filter").attr("id", "glow");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", 3)
      .attr("result", "coloredBlur");

    // background radial grid
    const grid = svg.append("g");
    [0.28, 0.35, 0.42].forEach((r) => {
      grid
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", size * r)
        .attr("fill", "none")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-dasharray", "3,4");
    });

    // core ring
    svg
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", size * 0.18)
      .attr("fill", "url(#ringGrad)")
      .style("filter", "url(#glow)");
    svg
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", size * 0.14)
      .attr("fill", "#fff");

    const maxVal = d3.max(d3Data, (d) => d.count) || 1;
    const scale = d3
      .scaleLinear()
      .domain([0, maxVal])
      .range([inner + 12, maxLen]);

    const group = svg.append("g");

    // Tooltip (HTML)
    const tooltip = container
      .selectAll(".dg-tooltip")
      .data([null])
      .join("div")
      .attr(
        "class",
        "dg-tooltip pointer-events-none absolute bg-white/95 backdrop-blur px-2 py-1 rounded shadow text-[11px] text-gray-700 border border-gray-200"
      )
      .style("opacity", 0);

    d3Data.forEach((d, i) => {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + inner * Math.cos(angle);
      const y1 = cy + inner * Math.sin(angle);
      const len = scale(d.count);
      const x2 = cx + len * Math.cos(angle);
      const y2 = cy + len * Math.sin(angle);

      const line = group
        .append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x1)
        .attr("y2", y1)
        .attr("stroke", d.color)
        .attr("stroke-width", 6)
        .attr("stroke-linecap", "round")
        .style("cursor", d.count > 0 ? "pointer" : "default")
        .on("mousemove", (event) => {
          if (d.count === 0) return;
          const [mx, my] = d3.pointer(event, containerRef.current);
          const companiesText =
            d.companies && d.companies.length
              ? d.companies.map((c) => `${c.name} (${c.count})`).join(", ")
              : "No company data";
          tooltip
            .style("left", `${mx + 10}px`)
            .style("top", `${my + 10}px`)
            .style("opacity", 1)
            .html(
              `<strong>${d.category}</strong>: ${d.count}<br/><span class="text-gray-500">${companiesText}</span>`
            );
        })
        .on("mouseleave", () => {
          tooltip.style("opacity", 0);
        });

      line
        .transition()
        .duration(600)
        .delay(i * 40)
        .attr("x2", x2)
        .attr("y2", y2);

      if (d.count > 0) {
        group
          .append("circle")
          .attr("cx", x2)
          .attr("cy", y2)
          .attr("r", 0)
          .attr("fill", d.color)
          .transition()
          .duration(600)
          .delay(i * 40 + 200)
          .attr("r", 3);

        const tx = cx + (len + 12) * Math.cos(angle);
        const ty = cy + (len + 12) * Math.sin(angle);
        group
          .append("text")
          .attr("x", tx)
          .attr("y", ty)
          .attr(
            "text-anchor",
            Math.cos(angle) > 0.3
              ? "start"
              : Math.cos(angle) < -0.3
              ? "end"
              : "middle"
          )
          .attr(
            "dominant-baseline",
            Math.sin(angle) > 0.3
              ? "hanging"
              : Math.sin(angle) < -0.3
              ? "ideographic"
              : "middle"
          )
          .attr("fill", "#374151")
          .style("font-size", "10px")
          .text(`${d.category.replace("First-Party/", "FP ")} (${d.count})`)
          .style("opacity", 0)
          .transition()
          .duration(400)
          .delay(i * 40 + 300)
          .style("opacity", 1);
      }
    });
  }, [d3Data]);

  return (
    <div className="p-4 flex flex-col gap-4 max-h-96 overflow-y-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate("popup")}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to summary"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <Header score={grade} />
      </div>

      <h1 className="text-lg font-bold text-center text-gray-900 -mt-4">
        Privacy Report for {new URL(url).hostname}
      </h1>

      {/* AI Privacy Policy Summary Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
          AI Privacy Analysis
        </h2>

        {hasAISummary ? (
          <div className="space-y-4">
            {/* What They Collect */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500" />
                What They Collect:
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {aiSummary.summary.whatTheyCollect
                  ?.slice(0, 5)
                  .map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </div>

            {/* Who They Share With */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-purple-500" />
                Who They Share With:
              </h3>
              <div className="flex flex-wrap gap-2">
                {aiSummary.summary.whoTheyShareWith
                  ?.slice(0, 6)
                  .map((company, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {company}
                    </span>
                  ))}
                {aiSummary.summary.whoTheyShareWith?.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{aiSummary.summary.whoTheyShareWith.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* How Long They Keep It */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                Data Retention:
              </h3>
              <p className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                {aiSummary.summary.howLongTheyKeep ||
                  "Information not available"}
              </p>
            </div>

            {/* Key Privacy Risks */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                Privacy Risks:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1 bg-red-50 p-2 rounded">
                {aiSummary.summary.keyRisks?.slice(0, 4).map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>

            {/* Tracker Breakdown */}
            {aiSummary.summary.trackerBreakdown?.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-4 h-4 text-yellow-500" />
                  Top Trackers Explained:
                </h3>
                <div className="space-y-2">
                  {aiSummary.summary.trackerBreakdown
                    .slice(0, 4)
                    .map((tracker, index) => (
                      <div
                        key={index}
                        className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400"
                      >
                        {tracker}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <ClipboardDocumentCheckIcon className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600">
              {aiSummary?.note || "AI analysis not available for this site"}
            </p>
            {simplifiedPolicy && (
              <p className="mt-2 text-xs text-gray-500 italic">
                {simplifiedPolicy}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Visual Data Flow Map - UPDATED WITH NETWORK VISUALIZATION */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-2 flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-green-600" />
          Data Flow Visualization
        </h2>
        
        <TrackerNetworkVisualization 
          url={url}
          trackerDetails={trackerDetails}
          aiSummary={aiSummary}
          trackerCount={trackerCount}
        />
        
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <strong>How to read:</strong> The central blue node is the website you're visiting. 
          Red particles show data flowing from your device to various tracking companies.
        </div>
      </div>

      {/* Centralized Consent Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3">Privacy Controls</h2>
        <div className="flex flex-col gap-3">
          <ToggleAction
            icon={<BellAlertIcon className="w-6 h-6 text-yellow-500" />}
            label="Block Notification Requests"
            initialState={permissions.notifications ?? false}
          />
          <ToggleAction
            icon={<WifiIcon className="w-6 h-6 text-blue-500" />}
            label="Block Marketing Cookies"
            initialState={permissions.cookies ?? false}
          />
          <ToggleAction
            icon={<ShieldExclamationIcon className="w-6 h-6 text-red-500" />}
            label="Block All Trackers"
            initialState={false}
          />
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <strong>Tip:</strong> Blocking trackers may affect website
          functionality but improves your privacy.
        </div>
      </div>

      {/* Analysis Info */}
      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Privacy Score: {score}/100 ({grade})
          </span>
          <span>{trackerCount} trackers detected</span>
        </div>
        {hasAISummary && (
          <div className="mt-1 text-center">
            <span className="inline-flex items-center">
              AI-powered analysis
              {!aiSummary.success && (
                <span className="ml-1 text-orange-600">(Limited)</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
    );
  };
  
  export default FullReportView;