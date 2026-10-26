import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpeedTimelineChart({ trajectory = [] }) {
  const chartData = trajectory.map(pt => ({
    time: pt.timestamp ? pt.timestamp.slice(11, 16) : '00:00',
    speed: pt.speed || 0,
    event: pt.event,
  }));

  return (
    <div className="w-full h-36 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#20D5E8" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#20D5E8" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
          <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
          <YAxis stroke="#94A3B8" fontSize={10} unit=" kn" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111B2D', borderColor: '#243249', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
            itemStyle={{ color: '#20D5E8' }}
          />
          <Area type="monotone" dataKey="speed" stroke="#20D5E8" strokeWidth={2} fillOpacity={1} fill="url(#speedGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
