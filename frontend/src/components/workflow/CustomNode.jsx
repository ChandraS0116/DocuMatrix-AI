import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { UploadCloud, Cpu, UserCheck, ShieldAlert, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDesignSystem } from '../../design/ThemeProvider';

export default function CustomNode({ data, selected }) {
  const { theme } = useDesignSystem();
  const isDark = theme.isDark;

  // Node styles based on type and status
  let borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  let bgColor = 'var(--bg-deep)';
  let iconColor = 'var(--text-muted)';
  let Icon = FileText;

  if (selected) {
    borderColor = 'var(--accent-blue)';
  }

  switch (data.type) {
    case 'upload':
      iconColor = 'var(--accent-blue)';
      Icon = UploadCloud;
      break;
    case 'ai':
      iconColor = 'var(--accent-purple)';
      Icon = Cpu;
      break;
    case 'human':
      iconColor = 'var(--accent-green)';
      Icon = UserCheck;
      break;
    case 'risk':
      iconColor = 'var(--accent-red)';
      Icon = ShieldAlert;
      break;
  }

  // Status indicator
  let StatusIcon = null;
  let statusColor = 'transparent';
  if (data.status === 'success') {
    StatusIcon = CheckCircle;
    statusColor = 'var(--accent-green)';
  } else if (data.status === 'pending') {
    StatusIcon = Clock;
    statusColor = 'var(--text-muted)';
  } else if (data.status === 'error') {
    StatusIcon = AlertCircle;
    statusColor = 'var(--accent-red)';
  }

  return (
    <div 
      className="hover-card"
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: selected ? '0 0 0 2px rgba(0, 229, 255, 0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '200px',
        position: 'relative'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: `${iconColor}15`, borderRadius: 'var(--radius-sm)' }}>
          <Icon size={20} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{data.label}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {data.type} NODE
          </div>
        </div>
        {StatusIcon && (
          <div style={{ color: statusColor }}>
            <StatusIcon size={16} />
          </div>
        )}
      </div>

      {/* Optional sub-label or metrics for inspector view */}
      {data.executionTime && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Execution:</span>
          <span>{data.executionTime}ms</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
    </div>
  );
}
