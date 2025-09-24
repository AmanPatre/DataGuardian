import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TrackerNetworkVisualization = ({
  url = "https://example.com",
  trackerDetails = [],
  aiSummary = null,
  trackerCount = 0,
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // [REMOVED] The conditional check for empty trackers is no longer needed here.
  // The parent component will handle this logic.

  // Process tracker data for visualization
  const processTrackerData = () => {
    const hostname = new URL(url).hostname;

    // Create central website node
    const nodes = [
      {
        id: hostname,
        type: "website",
        category: "website",
        company: hostname,
        x: 0,
        y: 0,
        size: 16,
      },
    ];

    const trackers = trackerDetails.slice(0, 12);

    // Color mapping for categories
    const categoryColors = {
      website: "#3b82f6",
      Advertising: "#ef4444",
      Analytics: "#10b981",
      "Tag Manager": "#f59e0b",
      "CDN/Utility": "#8b5cf6",
      Social: "#f97316",
      "First-Party/Analytics": "#06b6d4",
      Other: "#6b7280",
      Unknown: "#6b7280",
    };

    // Add tracker nodes
    trackers.forEach((tracker, index) => {
      nodes.push({
        id: `${tracker.company}-${index}`,
        type: "tracker",
        category: tracker.category || "Other",
        company: tracker.company,
        domain: tracker.domain || "unknown.com",
        size: 10,
        color:
          categoryColors[tracker.category] || categoryColors["Other"],
      });
    });

    // Create links from website to all trackers
    const links = [];
    trackers.forEach((tracker, index) => {
      links.push({
        source: hostname,
        target: `${tracker.company}-${index}`,
        type: "data-flow",
      });
    });

    return { nodes, links, categoryColors };
  };

  useEffect(() => {
    // [SAFETY CHECK] Although the parent handles it, an extra check prevents errors.
    if (!trackerDetails || trackerDetails.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current?.clientWidth || 320;
    const width = Math.min(containerWidth, 350);
    const height = 280;

    svg.attr("width", width).attr("height", height);

    const { nodes, links } = processTrackerData();

    // Create defs for gradients and filters
    const defs = svg.append("defs");
    const websiteGradient = defs
      .append("radialGradient")
      .attr("id", "websiteGradient");
    websiteGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#60a5fa");
    websiteGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6");

    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size + 2)
      );

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", "5,3");

    const particles = svg.append("g").attr("class", "particles");

    const node = svg
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    node
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) =>
        d.type === "website" ? "url(#websiteGradient)" : d.color
      )
      .attr("stroke", (d) => (d.type === "website" ? "#1e40af" : "#ffffff"))
      .attr("stroke-width", (d) => (d.type === "website" ? 3 : 2))
      .attr("filter", (d) => (d.type === "website" ? "url(#glow)" : "none"));

    node
      .append("text")
      .attr("dy", (d) => (d.type === "website" ? 25 : 18))
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", (d) => (d.type === "website" ? "bold" : "normal"))
      .style("fill", (d) => (d.type === "website" ? "#1e40af" : "#374151"))
      .text((d) => {
        if (d.type === "website") {
          return d.company.length > 15
            ? d.company.substring(0, 15) + "..."
            : d.company;
        }
        return d.company.length > 12
          ? d.company.substring(0, 12) + "..."
          : d.company;
      });

    node
      .filter((d) => d.type === "tracker")
      .append("text")
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .style("fill", "#6b7280")
      .text((d) => d.category);

    const animateParticles = () => {
      links.forEach((linkData) => {
        if (Math.random() < 0.3) {
          const sourceNode = nodes.find(
            (n) => n.id === linkData.source.id || n.id === linkData.source
          );
          const targetNode = nodes.find(
            (n) => n.id === linkData.target.id || n.id === linkData.target
          );

          if (sourceNode && targetNode) {
            const particle = particles
              .append("circle")
              .attr("r", 2)
              .attr("fill", "#ef4444")
              .attr("opacity", 0.8)
              .attr("cx", sourceNode.x)
              .attr("cy", sourceNode.y);

            particle
              .transition()
              .duration(2000)
              .attr("cx", targetNode.x)
              .attr("cy", targetNode.y)
              .attr("opacity", 0)
              .remove();
          }
        }
      });
    };

    node
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", d.size * 1.3)
          .attr("stroke-width", d.type === "website" ? 4 : 3);
      })
      .on("mouseout", (event, d) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", d.size)
          .attr("stroke-width", d.type === "website" ? 3 : 2);
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    const particleInterval = setInterval(animateParticles, 1500);

    return () => {
      clearInterval(particleInterval);
      simulation.stop();
    };
  }, [url, trackerDetails, aiSummary]);

  const { categoryColors } = processTrackerData();
  const uniqueCategories = [
    ...new Set(trackerDetails.map((t) => t.category || "Other")),
  ];

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        className="w-full border border-gray-200 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50"
      ></svg>

      {hoveredNode && (
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border text-xs max-w-48">
          <div className="font-semibold text-gray-900">
            {hoveredNode.company}
          </div>
          <div className="text-gray-600">{hoveredNode.category}</div>
          {hoveredNode.type === "website" && (
            <div className="text-blue-600 mt-1">Central Website</div>
          )}
          {hoveredNode.type === "tracker" && (
            <div>
              <div className="text-red-600 mt-1">Receives Your Data</div>
              <div className="text-gray-500 text-xs mt-1 font-mono">
                {hoveredNode.domain}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <span className="text-gray-600">Website</span>
        </div>
        {uniqueCategories.slice(0, 7).map((category) => (
          <div key={category} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  categoryColors[category] || categoryColors["Other"],
              }}
            ></div>
            <span className="text-gray-600 truncate">
              {category === "First-Party/Analytics" ? "FP Analytics" : category}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 text-xs text-center text-gray-500">
        <span className="inline-flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          Live data flow visualization • {trackerCount ||
            trackerDetails.length}{" "}
          trackers
        </span>
      </div>
    </div>
  );
};

export default TrackerNetworkVisualization;