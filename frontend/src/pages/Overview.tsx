import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, FileText, Code, Mail, MessageSquare, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion, animate } from "framer-motion";
import { toast } from "react-hot-toast";
import { apiFetch } from "../lib/api";

interface OverviewStats {
  totalThreats: number;
  statusCounts: {
    PENDING: number;
    CONFIRMED: number;
    FALSE_POSITIVE: number;
  };
  sourceDistribution: {
    LOG: number;
    CODE: number;
    EMAIL: number;
    CHAT: number;
  };
  recentActivity: Array<{
    _id: string;
    sourceTitle: string;
    source: string;
    severity: string;
    reviewStatus: string;
    createdAt: string;
  }>;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(v) {
        setCount(Math.round(v));
      }
    });
    return () => controls.stop();
  }, [value]);

  return <span>{count}</span>;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 shadow-[0_0_20px_rgba(0,212,195,0.15)] backdrop-blur-xl">
        <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-2">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill || '#00d4c3' }} />
            <p className="text-sm font-mono font-medium text-white">
              {entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/overview/stats", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load dashboard overview.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-12 w-12 rounded-full border-2 border-[#00d4c3]/30 border-t-[#00d4c3]" />
          <span className="text-xs font-mono text-[#00d4c3] animate-pulse tracking-widest uppercase">Initializing Dashboard</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-[#ff3b30]/50" />
          <p className="text-sm font-mono text-white/50">Unable to load security metrics.</p>
        </div>
      </div>
    );
  }

  const { totalThreats, statusCounts, sourceDistribution, recentActivity } = stats;

  const pieData = [
    { name: "Logs", value: sourceDistribution.LOG },
    { name: "Code", value: sourceDistribution.CODE },
    { name: "Emails", value: sourceDistribution.EMAIL },
    { name: "Chat", value: sourceDistribution.CHAT },
  ].filter(d => d.value > 0);

  const barData = [
    { name: "Pending", count: statusCounts.PENDING },
    { name: "Confirmed", count: statusCounts.CONFIRMED },
    { name: "False Positives", count: statusCounts.FALSE_POSITIVE },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const StatCard = ({ title, value, icon: Icon, color, glowClass, hoverShadow }: any) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 ${hoverShadow}`}
    >
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-20 ${glowClass}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">{title}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 ${color}`}>
            <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-6 relative z-10">
        <span className={`text-4xl font-bold font-mono tracking-tight ${color}`}>
            <AnimatedCounter value={value} />
        </span>
      </div>
    </motion.div>
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "LOG": return <FileText className="h-4 w-4 text-[#00d4c3]" />;
      case "CODE": return <Code className="h-4 w-4 text-[#ff9500]" />;
      case "EMAIL": return <Mail className="h-4 w-4 text-[#ff3b30]" />;
      case "CHAT": return <MessageSquare className="h-4 w-4 text-[#5ac8fa]" />;
      default: return <AlertCircle className="h-4 w-4 text-white/50" />;
    }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="flex flex-col gap-6 p-2 max-w-7xl mx-auto w-full h-full overflow-y-auto scrollbar-none pb-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Security Overview
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Aggregated threat intelligence and system metrics.
        </p>
      </motion.div>

      {/* Top Row: Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Scans" 
          value={totalThreats} 
          icon={ShieldAlert} 
          color="text-[#00d4c3]" 
          glowClass="bg-[#00d4c3]"
          hoverShadow="hover:shadow-[0_8px_30px_rgba(0,212,195,0.2)] hover:border-[#00d4c3]/30"
        />
        <StatCard 
          title="Pending Reviews" 
          value={statusCounts.PENDING} 
          icon={AlertTriangle} 
          color="text-[#ff9500]" 
          glowClass={statusCounts.PENDING > 0 ? "bg-[#ff9500]" : "bg-transparent"}
          hoverShadow="hover:shadow-[0_8px_30px_rgba(255,149,0,0.2)] hover:border-[#ff9500]/30"
        />
        <StatCard 
          title="Confirmed Threats" 
          value={statusCounts.CONFIRMED} 
          icon={AlertCircle} 
          color="text-[#ff3b30]" 
          glowClass={statusCounts.CONFIRMED > 0 ? "bg-[#ff3b30]" : "bg-transparent"}
          hoverShadow="hover:shadow-[0_8px_30px_rgba(255,59,48,0.2)] hover:border-[#ff3b30]/30"
        />
        <StatCard 
          title="False Positives" 
          value={statusCounts.FALSE_POSITIVE} 
          icon={CheckCircle2} 
          color="text-white/50" 
          glowClass="bg-white/20"
          hoverShadow="hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:border-white/20"
        />
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Source Distribution */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl"
        >
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-white/60">Threat Source Distribution</h2>
          <div className="h-[280px] w-full">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/30 text-sm font-mono">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4c3" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#005952" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8a0f0a" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff9500" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8a5100" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5ac8fa" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1e5c7a" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => {
                      let url = "url(#colorTeal)";
                      let strokeColor = "#00d4c3";
                      if (entry.name === 'Emails') { url = "url(#colorRed)"; strokeColor = "#ff3b30"; }
                      else if (entry.name === 'Code') { url = "url(#colorOrange)"; strokeColor = "#ff9500"; }
                      else if (entry.name === 'Chat') { url = "url(#colorBlue)"; strokeColor = "#5ac8fa"; }

                      return <Cell key={`cell-${index}`} fill={url} stroke={strokeColor} strokeWidth={1} style={{ filter: `drop-shadow(0px 0px 8px ${strokeColor}40)` }} />
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Status Counts */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl"
        >
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-white/60">Review Status Overview</h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4c3" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#00d4c3" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b30" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#ff3b30" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff9500" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#ff9500" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="barGray" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#888888" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#888888" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#888' }} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  {barData.map((entry, index) => {
                    let url = "url(#barGray)";
                    let strokeColor = "#888888";
                    if (entry.name === 'Confirmed') { url = "url(#barRed)"; strokeColor = "#ff3b30"; }
                    else if (entry.name === 'Pending') { url = "url(#barOrange)"; strokeColor = "#ff9500"; }

                    return <Cell key={`cell-${index}`} fill={url} stroke={strokeColor} strokeWidth={1} style={{ filter: `drop-shadow(0px -4px 12px ${strokeColor}40)` }} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Bottom Row: Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden flex flex-col shadow-xl min-h-[350px] flex-1"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/80">Recent Activity Stream</h2>
          {statusCounts.PENDING > 0 && (
            <Link to="/dashboard/ai-training" className="group flex items-center gap-1.5 rounded-full border border-[#00d4c3]/30 bg-[#00d4c3]/10 px-3 py-1 text-[11px] font-semibold text-[#00d4c3] transition-all hover:bg-[#00d4c3]/20 hover:shadow-[0_0_15px_rgba(0,212,195,0.3)]">
              View AI Inbox <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {recentActivity.length === 0 ? (
            <div className="p-12 text-center text-white/40 text-sm font-mono">No recent activity detected on the network.</div>
          ) : (
            <table className="w-full text-left text-sm text-white/90">
              <thead className="bg-black/40 text-[10px] uppercase text-gray-400 font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">SOURCE</th>
                  <th className="px-6 py-4">TITLE/SUBJECT</th>
                  <th className="px-6 py-4">SEVERITY</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right rounded-tr-lg">ACTION</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-white/5">
                {recentActivity.map((threat) => (
                  <motion.tr variants={itemVariants} key={threat._id} className="hover:bg-white/5 transition-colors duration-300 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 border border-white/10 group-hover:border-white/20 transition-colors">
                          {getSourceIcon(threat.source)}
                        </div>
                        <span className="font-mono text-xs tracking-wider text-white/70">{threat.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium max-w-[250px] truncate text-white/80 group-hover:text-white transition-colors" title={threat.sourceTitle}>
                      {threat.sourceTitle}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {threat.severity === 'critical' && <div className="h-2 w-2 rounded-full bg-[#ff3b30] animate-pulse shadow-[0_0_8px_#ff3b30]" />}
                        <span className={`px-2.5 py-1 rounded bg-black/40 text-[10px] font-bold uppercase tracking-widest border ${
                          threat.severity === 'critical' ? 'border-[#ff3b30]/30 text-[#ff3b30]' :
                          threat.severity === 'high' ? 'border-[#ff9500]/30 text-[#ff9500]' :
                          threat.severity === 'medium' ? 'border-[#ffcc00]/30 text-[#ffcc00]' :
                          'border-[#00d4c3]/30 text-[#00d4c3]'
                        }`}>
                          {threat.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          threat.reviewStatus === 'PENDING' ? 'bg-[#ff9500] shadow-[0_0_8px_#ff9500]' :
                          threat.reviewStatus === 'CONFIRMED' ? 'bg-[#ff3b30]' : 'bg-white/30'
                        }`} />
                        <span className={`text-[11px] font-mono tracking-wider ${threat.reviewStatus === 'PENDING' ? 'text-[#ff9500]' : 'text-white/50'}`}>
                          {threat.reviewStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {threat.reviewStatus === 'PENDING' ? (
                        <Link 
                          to="/dashboard/ai-training"
                          className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
                        >
                          Review
                        </Link>
                      ) : (
                        <span className="text-[10px] text-white/30 font-mono tracking-widest uppercase">
                          Processed
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
