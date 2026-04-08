import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Activity, Heart, Target, Flame, TrendingUp, Award, Calendar, Clock } from "lucide-react";

const weeklyData = [
  { day: "Mon", sessions: 2, reps: 45, calories: 120 },
  { day: "Tue", sessions: 1, reps: 30, calories: 80 },
  { day: "Wed", sessions: 3, reps: 65, calories: 180 },
  { day: "Thu", sessions: 0, reps: 0, calories: 0 },
  { day: "Fri", sessions: 2, reps: 50, calories: 140 },
  { day: "Sat", sessions: 1, reps: 25, calories: 70 },
  { day: "Sun", sessions: 2, reps: 40, calories: 110 },
];

const progressData = [
  { week: "W1", score: 45, flexibility: 30, strength: 40 },
  { week: "W2", score: 52, flexibility: 35, strength: 45 },
  { week: "W3", score: 58, flexibility: 42, strength: 50 },
  { week: "W4", score: 65, flexibility: 48, strength: 58 },
  { week: "W5", score: 70, flexibility: 55, strength: 63 },
  { week: "W6", score: 78, flexibility: 60, strength: 70 },
];

const monthlyData = [
  { month: "Jan", sessions: 18 },
  { month: "Feb", sessions: 22 },
  { month: "Mar", sessions: 25 },
  { month: "Apr", sessions: 20 },
  { month: "May", sessions: 28 },
  { month: "Jun", sessions: 32 },
];

const bodyPartData = [
  { name: "Upper Body", value: 35, color: "#2563eb" },
  { name: "Core", value: 25, color: "#0ea5e9" },
  { name: "Lower Body", value: 30, color: "#06b6d4" },
  { name: "Full Body", value: 10, color: "#14b8a6" },
];

const Reports = () => {
  const { user } = useAuth();

  const summaryCards = [
    { label: "Total Sessions", value: "42", icon: Activity, trend: "+12%", color: "text-primary" },
    { label: "Exercises Done", value: "312", icon: Target, trend: "+18%", color: "text-accent" },
    { label: "Avg Form Score", value: "82%", icon: Award, trend: "+8%", color: "text-green-500" },
    { label: "Streak", value: "5 days", icon: Flame, trend: "+2", color: "text-orange-500" },
    { label: "Calories Burned", value: "2,480", icon: Heart, trend: "+15%", color: "text-red-500" },
    { label: "Hours Trained", value: "18.5h", icon: Clock, trend: "+5h", color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your recovery progress over time</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-elevated transition-shadow">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <span className="text-xs font-medium text-green-600 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> {s.trend}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="reps" fill="hsl(213, 85%, 45%)" radius={[4, 4, 0, 0]} name="Reps" />
              <Bar dataKey="calories" fill="hsl(199, 85%, 50%)" radius={[4, 4, 0, 0]} name="Calories" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Recovery Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="hsl(213, 85%, 45%)" fill="hsl(213, 85%, 45%)" fillOpacity={0.1} strokeWidth={2} name="Overall" />
              <Area type="monotone" dataKey="flexibility" stroke="hsl(160, 85%, 45%)" fill="hsl(160, 85%, 45%)" fillOpacity={0.1} strokeWidth={2} name="Flexibility" />
              <Area type="monotone" dataKey="strength" stroke="hsl(280, 85%, 60%)" fill="hsl(280, 85%, 60%)" fillOpacity={0.1} strokeWidth={2} name="Strength" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Exercise Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={bodyPartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {bodyPartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Monthly Sessions</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="sessions" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Profile */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Health Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              { label: "BMI", value: user?.bmi, max: 40 },
              { label: "Recovery Score", value: 78, max: 100 },
              { label: "Flexibility", value: 65, max: 100 },
              { label: "Strength", value: 72, max: 100 },
              { label: "Endurance", value: 60, max: 100 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div className="bg-primary rounded-full h-2" initial={{ width: 0 }} animate={{ width: `${((item.value || 0) / item.max) * 100}%` }} transition={{ duration: 1 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {/* Recent Achievements */}
            <h4 className="font-display font-semibold text-foreground">Recent Achievements</h4>
            {[
              { icon: "🏆", title: "5 Day Streak", desc: "Completed 5 consecutive days of training" },
              { icon: "💪", title: "100 Reps Club", desc: "Completed 100+ reps in a single session" },
              { icon: "🎯", title: "Perfect Form", desc: "Achieved 95%+ form quality on 3 exercises" },
              { icon: "🔥", title: "Calorie Crusher", desc: "Burned 500+ calories this week" },
            ].map(ach => (
              <div key={ach.title} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                <span className="text-xl">{ach.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{ach.title}</p>
                  <p className="text-xs text-muted-foreground">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
