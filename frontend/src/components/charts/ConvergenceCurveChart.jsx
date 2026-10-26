import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConvergenceCurveChart({ history = [] }) {
  const chartData = history.map((val, idx) => ({
    iteration: idx + 1,
    fitness: parseFloat(Number(val).toFixed(4)),
  }));

  return (
    <div className="w-full h-40 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
          <XAxis dataKey="iteration" stroke="#94A3B8" fontSize={10} />
          <YAxis stroke="#94A3B8" fontSize={10} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111B2D', borderColor: '#243249', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
            itemStyle={{ color: '#20D5E8' }}
          />
          <Line 
            type="monotone" 
            dataKey="fitness" 
            stroke="#20D5E8" 
            strokeWidth={2} 
            dot={{ r: 2, fill: '#20D5E8' }} 
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
