import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { performance, subjectPerformance } from "../../data/mockData";

export function PerformanceLineChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={performance}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#2f80ed" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SubjectBarChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={subjectPerformance}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="subject" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="score" fill="#15b8a6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivityAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={performance}>
        <defs>
          <linearGradient id="hours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2f80ed" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2f80ed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="hours" stroke="#2f80ed" fill="url(#hours)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart() {
  const data = [
    { name: "Excellent", value: 34, color: "#15b8a6" },
    { name: "Good", value: 42, color: "#2f80ed" },
    { name: "Needs Help", value: 18, color: "#f97366" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={4}>
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
