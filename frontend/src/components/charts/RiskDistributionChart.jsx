import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RiskDistributionChart({ data = [] }) {
  return (
    <div className="w-full h-56 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
          <XAxis dataKey="tier" stroke="#94A3B8" fontSize={10} />
          <YAxis stroke="#94A3B8" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111B2D', borderColor: '#243249', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
            itemStyle={{ color: '#20D5E8' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#4285F4'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
