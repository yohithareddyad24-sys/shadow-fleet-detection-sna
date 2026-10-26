import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FlagDistributionChart({ data = [] }) {
  return (
    <div className="w-full h-56 font-mono">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#243249" />
          <XAxis type="number" stroke="#94A3B8" fontSize={10} />
          <YAxis type="category" dataKey="flag" stroke="#94A3B8" fontSize={9} width={90} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111B2D', borderColor: '#243249', fontSize: '11px', fontFamily: 'JetBrains Mono' }} 
            itemStyle={{ color: '#4285F4' }}
          />
          <Bar dataKey="count" fill="#4285F4" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
