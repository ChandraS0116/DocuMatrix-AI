// 30 Professionally Curated Themes organized into families

const createTheme = (name, family, isDark, colors) => ({
  name,
  family,
  isDark,
  tokens: {
    '--bg-deep': colors.bgDeep,
    '--bg-panel': colors.bgPanel,
    '--bg-panel-hover': colors.bgPanelHover,
    '--border-light': colors.borderLight,
    '--border-focus': colors.borderFocus,
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-muted': colors.textMuted,
    '--accent-primary': colors.accentPrimary || '#00e5ff',
    '--accent-secondary': colors.accentSecondary || '#2563eb',
    '--accent-blue': colors.accentBlue || '#00e5ff',
    '--accent-purple': colors.accentPurple || '#3b82f6',
    '--accent-red': colors.accentRed || '#ff3366',
    '--accent-green': colors.accentGreen || '#00e676',
    '--accent-yellow': colors.accentYellow || '#ffea00',
    '--shadow-glass': colors.shadowGlass || (isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(31, 38, 135, 0.07)'),
    '--backdrop-blur': 'blur(12px)',
  }
});

// Helper for dark themes with subtle variations
const darkBase = {
  textPrimary: '#f0f0f5', textSecondary: '#a0a0b0', textMuted: '#606070',
  accentRed: '#ff3366', accentGreen: '#00e676', accentYellow: '#ffea00',
};

// Helper for light themes
const lightBase = {
  textPrimary: '#0f0f0f', textSecondary: '#606060', textMuted: '#909090',
  accentRed: '#cc0000', accentGreen: '#0f9d58', accentYellow: '#d97706',
};

export const themeFamilies = ['Executive', 'Dark Enterprise', 'Cyber', 'Nature', 'Creative', 'Cosmic'];

export const themes = [
  // ================= FLAGSHIP ENTERPRISE THEMES =================
  createTheme('Light', 'Executive', false, {
    textPrimary: '#0f0f0f', textSecondary: '#606060', textMuted: '#909090',
    accentRed: '#cc0000', accentGreen: '#0f9d58', accentYellow: '#d97706',
    bgDeep: '#f9f9f9', bgPanel: '#ffffff', bgPanelHover: '#f2f2f2',
    borderLight: '#e5e5e5', borderFocus: '#065fd4',
    accentPrimary: '#065fd4', accentSecondary: '#cc0000', accentBlue: '#065fd4', accentPurple: '#475569',
    shadowGlass: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
  }),
  createTheme('Dark', 'Executive', true, {
    textPrimary: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b',
    accentRed: '#ef4444', accentGreen: '#10b981', accentYellow: '#f59e0b',
    bgDeep: '#0f172a', bgPanel: '#1e293b', bgPanelHover: '#334155',
    borderLight: '#334155', borderFocus: '#38bdf8',
    accentPrimary: '#38bdf8', accentSecondary: '#0284c7', accentBlue: '#38bdf8', accentPurple: '#64748b',
    shadowGlass: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  }),
  createTheme('Soft Light', 'Executive', false, {
    textPrimary: '#262626', textSecondary: '#737373', textMuted: '#8e8e8e',
    accentRed: '#ed4956', accentGreen: '#00ba88', accentYellow: '#f59e0b',
    bgDeep: '#fafafa', bgPanel: '#ffffff', bgPanelHover: '#f0f2f5',
    borderLight: '#dbdbdb', borderFocus: '#0095f6',
    accentPrimary: '#0095f6', accentSecondary: '#262626', accentBlue: '#0095f6', accentPurple: '#64748b',
    shadowGlass: '0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
  }),
  createTheme('Executive Blue', 'Executive', false, {
    ...lightBase,
    bgDeep: '#f4f5f7', bgPanel: 'rgba(255, 255, 255, 0.95)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: '#e5e7eb', borderFocus: 'rgba(0, 82, 204, 0.4)',
    accentPrimary: '#0052cc', accentSecondary: '#0047b3', accentBlue: '#0052cc', accentPurple: '#2563eb'
  }),
  createTheme('Executive Light', 'Executive', false, {
    ...lightBase,
    bgDeep: '#ffffff', bgPanel: 'rgba(248, 249, 250, 0.95)', bgPanelHover: 'rgba(241, 243, 245, 1)',
    borderLight: '#e9ecef', borderFocus: 'rgba(34, 139, 230, 0.4)',
    accentPrimary: '#228be6', accentSecondary: '#1c7ed6', accentBlue: '#228be6', accentPurple: '#0284c7'
  }),
  createTheme('Minimal White', 'Executive', false, {
    ...lightBase,
    bgDeep: '#ffffff', bgPanel: 'rgba(255, 255, 255, 0.98)', bgPanelHover: '#f8f9fa',
    borderLight: '#e5e7eb', borderFocus: '#ced4da',
    accentPrimary: '#212529', accentSecondary: '#343a40', accentBlue: '#228be6', accentPurple: '#0284c7'
  }),
  createTheme('Enterprise Navy', 'Executive', true, {
    ...darkBase,
    bgDeep: '#0f172a', bgPanel: 'rgba(30, 41, 59, 0.6)', bgPanelHover: 'rgba(30, 41, 59, 0.9)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(56, 189, 248, 0.4)',
    accentPrimary: '#38bdf8', accentSecondary: '#38bdf8', accentBlue: '#38bdf8', accentPurple: '#38bdf8'
  }),
  createTheme('Corporate Slate', 'Executive', true, {
    ...darkBase,
    bgDeep: '#1e293b', bgPanel: 'rgba(51, 65, 85, 0.6)', bgPanelHover: 'rgba(51, 65, 85, 0.9)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(94, 234, 212, 0.4)',
    accentPrimary: '#5eead4', accentSecondary: '#38bdf8', accentBlue: '#38bdf8', accentPurple: '#38bdf8'
  }),
  createTheme('Oxford', 'Executive', true, {
    ...darkBase,
    bgDeep: '#001529', bgPanel: 'rgba(0, 33, 64, 0.6)', bgPanelHover: 'rgba(0, 40, 77, 0.9)',
    borderLight: 'rgba(255, 255, 255, 0.08)', borderFocus: 'rgba(24, 144, 255, 0.4)',
    accentPrimary: '#1890ff', accentSecondary: '#0284c7', accentBlue: '#1890ff', accentPurple: '#0284c7'
  }),
  createTheme('Platinum', 'Executive', false, {
    ...lightBase,
    bgDeep: '#e2e8f0', bgPanel: 'rgba(248, 250, 252, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(148, 163, 184, 0.3)', borderFocus: 'rgba(71, 85, 105, 0.5)',
    accentPrimary: '#475569', accentSecondary: '#334155', accentBlue: '#0284c7', accentPurple: '#475569'
  }),
  createTheme('Graphite Light', 'Executive', false, {
    ...lightBase,
    bgDeep: '#f3f4f6', bgPanel: 'rgba(255, 255, 255, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(0, 0, 0, 0.08)', borderFocus: 'rgba(55, 65, 81, 0.4)',
    accentPrimary: '#374151', accentSecondary: '#1f2937', accentBlue: '#2563eb', accentPurple: '#475569'
  }),

  // ================= DARK ENTERPRISE (6) =================
  createTheme('Graphite', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#111827', bgPanel: 'rgba(31, 41, 55, 0.6)', bgPanelHover: 'rgba(55, 65, 81, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.08)', borderFocus: 'rgba(96, 165, 250, 0.4)',
    accentPrimary: '#60a5fa', accentSecondary: '#38bdf8', accentBlue: '#60a5fa', accentPurple: '#64748b'
  }),
  createTheme('Carbon', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#000000', bgPanel: 'rgba(26, 26, 26, 0.6)', bgPanelHover: 'rgba(38, 38, 38, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(163, 163, 163, 0.4)',
    accentPrimary: '#d4d4d4', accentSecondary: '#a3a3a3', accentBlue: '#3b82f6', accentPurple: '#2563eb'
  }),
  createTheme('Midnight', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#0a0a0c', bgPanel: 'rgba(25, 25, 30, 0.6)', bgPanelHover: 'rgba(35, 35, 45, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.08)', borderFocus: 'rgba(0, 195, 255, 0.4)',
    accentPrimary: '#00e5ff', accentSecondary: '#3b82f6', accentBlue: '#00e5ff', accentPurple: '#3b82f6'
  }),
  createTheme('Titanium', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#18181b', bgPanel: 'rgba(39, 39, 42, 0.6)', bgPanelHover: 'rgba(63, 63, 70, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.08)', borderFocus: 'rgba(161, 161, 170, 0.4)',
    accentPrimary: '#a1a1aa', accentSecondary: '#71717a', accentBlue: '#38bdf8', accentPurple: '#64748b'
  }),
  createTheme('Obsidian', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#050505', bgPanel: 'rgba(20, 20, 20, 0.6)', bgPanelHover: 'rgba(30, 30, 30, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.05)', borderFocus: 'rgba(120, 120, 120, 0.4)',
    accentPrimary: '#a3a3a3', accentSecondary: '#737373', accentBlue: '#0284c7', accentPurple: '#475569'
  }),
  createTheme('Onyx', 'Dark Enterprise', true, {
    ...darkBase,
    bgDeep: '#09090b', bgPanel: 'rgba(24, 24, 27, 0.7)', bgPanelHover: 'rgba(39, 39, 42, 0.9)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(228, 228, 231, 0.4)',
    accentPrimary: '#e4e4e7', accentSecondary: '#a1a1aa', accentBlue: '#60a5fa', accentPurple: '#38bdf8'
  }),

  // ================= CYBER (6) =================
  createTheme('Cyber Green', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#050d08', bgPanel: 'rgba(10, 30, 15, 0.6)', bgPanelHover: 'rgba(20, 50, 25, 0.8)',
    borderLight: 'rgba(0, 255, 100, 0.15)', borderFocus: 'rgba(0, 255, 100, 0.5)',
    accentPrimary: '#00ff66', accentSecondary: '#00cc55', accentBlue: '#00eeff', accentPurple: '#00e5ff'
  }),
  createTheme('Cyberpunk', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#0b1329', bgPanel: 'rgba(15, 23, 42, 0.6)', bgPanelHover: 'rgba(30, 41, 59, 0.8)',
    borderLight: 'rgba(255, 0, 128, 0.2)', borderFocus: 'rgba(0, 255, 255, 0.5)',
    accentPrimary: '#ff007f', accentSecondary: '#00ffff', accentBlue: '#00ffff', accentPurple: '#ff007f'
  }),
  createTheme('Neon', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#000000', bgPanel: 'rgba(15, 15, 20, 0.8)', bgPanelHover: 'rgba(25, 25, 35, 1)',
    borderLight: 'rgba(0, 229, 255, 0.2)', borderFocus: 'rgba(0, 229, 255, 0.6)',
    accentPrimary: '#00e5ff', accentSecondary: '#00b4d8', accentBlue: '#00e5ff', accentPurple: '#00b4d8'
  }),
  createTheme('Matrix', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#000000', bgPanel: 'rgba(0, 20, 0, 0.6)', bgPanelHover: 'rgba(0, 40, 0, 0.8)',
    borderLight: 'rgba(0, 255, 0, 0.2)', borderFocus: 'rgba(0, 255, 0, 0.6)',
    accentPrimary: '#00ff00', accentSecondary: '#008800', accentBlue: '#00ccff', accentPurple: '#0284c7'
  }),
  createTheme('Synthwave', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#1a0b2e', bgPanel: 'rgba(45, 11, 85, 0.6)', bgPanelHover: 'rgba(75, 22, 135, 0.8)',
    borderLight: 'rgba(249, 168, 38, 0.2)', borderFocus: 'rgba(255, 51, 102, 0.6)',
    accentPrimary: '#ff3366', accentSecondary: '#f9a826', accentBlue: '#00f0ff', accentPurple: '#0369a1'
  }),
  createTheme('Hacker', 'Cyber', true, {
    ...darkBase,
    bgDeep: '#0a0a0a', bgPanel: 'rgba(20, 20, 20, 0.8)', bgPanelHover: 'rgba(35, 35, 35, 1)',
    borderLight: 'rgba(200, 200, 200, 0.1)', borderFocus: 'rgba(255, 255, 255, 0.4)',
    accentPrimary: '#ffffff', accentSecondary: '#cccccc', accentBlue: '#00e5ff', accentPurple: '#64748b'
  }),

  // ================= NATURE (5) =================
  createTheme('Emerald', 'Nature', true, {
    ...darkBase,
    bgDeep: '#064e3b', bgPanel: 'rgba(6, 95, 70, 0.6)', bgPanelHover: 'rgba(4, 120, 87, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(16, 185, 129, 0.5)',
    accentPrimary: '#10b981', accentSecondary: '#34d399', accentBlue: '#3b82f6', accentPurple: '#2563eb'
  }),
  createTheme('Forest', 'Nature', false, {
    ...lightBase,
    bgDeep: '#f0fdf4', bgPanel: 'rgba(255, 255, 255, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(22, 163, 74, 0.2)', borderFocus: 'rgba(22, 163, 74, 0.5)',
    accentPrimary: '#16a34a', accentSecondary: '#15803d', accentBlue: '#2563eb', accentPurple: '#475569'
  }),
  createTheme('Ocean', 'Nature', true, {
    ...darkBase,
    bgDeep: '#083344', bgPanel: 'rgba(22, 78, 99, 0.6)', bgPanelHover: 'rgba(21, 94, 117, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(6, 182, 212, 0.5)',
    accentPrimary: '#06b6d4', accentSecondary: '#22d3ee', accentBlue: '#0ea5e9', accentPurple: '#2563eb'
  }),
  createTheme('Aurora', 'Nature', true, {
    ...darkBase,
    bgDeep: '#022c22', bgPanel: 'rgba(4, 120, 87, 0.4)', bgPanelHover: 'rgba(5, 150, 105, 0.6)',
    borderLight: 'rgba(52, 211, 153, 0.2)', borderFocus: 'rgba(167, 243, 208, 0.5)',
    accentPrimary: '#34d399', accentSecondary: '#a7f3d0', accentBlue: '#38bdf8', accentPurple: '#38bdf8'
  }),
  createTheme('Earth', 'Nature', false, {
    ...lightBase,
    bgDeep: '#fffbeb', bgPanel: 'rgba(254, 243, 199, 0.6)', bgPanelHover: 'rgba(253, 230, 138, 0.8)',
    borderLight: 'rgba(217, 119, 6, 0.2)', borderFocus: 'rgba(217, 119, 6, 0.5)',
    accentPrimary: '#d97706', accentSecondary: '#b45309', accentBlue: '#0284c7', accentPurple: '#475569'
  }),

  // ================= CREATIVE (5) =================
  createTheme('Sakura', 'Creative', false, {
    ...lightBase,
    bgDeep: '#fdf2f8', bgPanel: 'rgba(255, 255, 255, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(219, 39, 119, 0.1)', borderFocus: 'rgba(219, 39, 119, 0.4)',
    accentPrimary: '#db2777', accentSecondary: '#be185d', accentBlue: '#2563eb', accentPurple: '#475569'
  }),
  createTheme('Sunset', 'Creative', true, {
    ...darkBase,
    bgDeep: '#450a0a', bgPanel: 'rgba(127, 29, 29, 0.6)', bgPanelHover: 'rgba(153, 27, 27, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(249, 115, 22, 0.5)',
    accentPrimary: '#f97316', accentSecondary: '#ea580c', accentBlue: '#3b82f6', accentPurple: '#64748b'
  }),
  createTheme('Corporate Cobalt', 'Creative', true, {
    ...darkBase,
    bgDeep: '#0f172a', bgPanel: 'rgba(30, 41, 59, 0.6)', bgPanelHover: 'rgba(30, 41, 59, 0.9)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(139, 92, 246, 0.5)',
    accentPrimary: '#2563eb', accentSecondary: '#64748b', accentBlue: '#3b82f6', accentPurple: '#2563eb'
  }),
  createTheme('Bronze', 'Creative', true, {
    ...darkBase,
    bgDeep: '#271c19', bgPanel: 'rgba(67, 44, 38, 0.6)', bgPanelHover: 'rgba(87, 54, 46, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.1)', borderFocus: 'rgba(217, 119, 6, 0.5)',
    accentPrimary: '#d97706', accentSecondary: '#f59e0b', accentBlue: '#38bdf8', accentPurple: '#38bdf8'
  }),
  createTheme('Gold', 'Creative', false, {
    ...lightBase,
    bgDeep: '#fefce8', bgPanel: 'rgba(255, 255, 255, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(234, 179, 8, 0.3)', borderFocus: 'rgba(202, 138, 4, 0.5)',
    accentPrimary: '#eab308', accentSecondary: '#ca8a04', accentBlue: '#2563eb', accentPurple: '#1d4ed8'
  }),

  // ================= COSMIC (8) =================
  createTheme('Nebula Cobalt', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#050c18', bgPanel: 'rgba(10, 25, 45, 0.6)', bgPanelHover: 'rgba(20, 40, 70, 0.8)',
    borderLight: 'rgba(6, 95, 212, 0.2)', borderFocus: 'rgba(6, 95, 212, 0.6)',
    accentPrimary: '#065fd4', accentSecondary: '#0095f6', accentBlue: '#065fd4', accentPurple: '#475569'
  }),
  createTheme('Solar Flare', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#140500', bgPanel: 'rgba(35, 10, 0, 0.6)', bgPanelHover: 'rgba(55, 15, 0, 0.8)',
    borderLight: 'rgba(255, 100, 0, 0.1)', borderFocus: 'rgba(255, 100, 0, 0.5)',
    accentPrimary: '#ff4500', accentSecondary: '#ffd700', accentBlue: '#38bdf8', accentPurple: '#64748b'
  }),
  createTheme('Andromeda', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#050a1f', bgPanel: 'rgba(10, 20, 50, 0.6)', bgPanelHover: 'rgba(20, 35, 75, 0.8)',
    borderLight: 'rgba(100, 150, 255, 0.1)', borderFocus: 'rgba(100, 150, 255, 0.4)',
    accentPrimary: '#88ccff', accentSecondary: '#94a3b8', accentBlue: '#88ccff', accentPurple: '#94a3b8'
  }),
  createTheme('Event Horizon', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#020202', bgPanel: 'rgba(10, 10, 10, 0.6)', bgPanelHover: 'rgba(20, 20, 20, 0.8)',
    borderLight: 'rgba(255, 255, 255, 0.05)', borderFocus: 'rgba(200, 200, 200, 0.4)',
    accentPrimary: '#f0f0f0', accentSecondary: '#aa0000', accentBlue: '#88ccff', accentPurple: '#64748b', accentRed: '#990000'
  }),
  createTheme('Pulsar', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#000514', bgPanel: 'rgba(5, 15, 40, 0.7)', bgPanelHover: 'rgba(10, 25, 60, 0.9)',
    borderLight: 'rgba(0, 255, 255, 0.2)', borderFocus: 'rgba(0, 255, 255, 0.6)',
    accentPrimary: '#e0ffff', accentSecondary: '#00ffff', accentBlue: '#00ffff', accentPurple: '#38bdf8'
  }),
  createTheme('Aurora Borealis Sky', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#01151a', bgPanel: 'rgba(5, 30, 35, 0.6)', bgPanelHover: 'rgba(10, 45, 55, 0.8)',
    borderLight: 'rgba(0, 255, 200, 0.1)', borderFocus: 'rgba(0, 255, 200, 0.4)',
    accentPrimary: '#00ffcc', accentSecondary: '#38bdf8', accentBlue: '#00ffcc', accentPurple: '#38bdf8'
  }),
  createTheme('Red Giant', 'Cosmic', true, {
    ...darkBase,
    bgDeep: '#1a0505', bgPanel: 'rgba(40, 10, 10, 0.6)', bgPanelHover: 'rgba(60, 15, 15, 0.8)',
    borderLight: 'rgba(255, 50, 50, 0.1)', borderFocus: 'rgba(255, 50, 50, 0.4)',
    accentPrimary: '#ff3333', accentSecondary: '#ff8800', accentBlue: '#38bdf8', accentPurple: '#64748b'
  }),
  createTheme('Lunar Space', 'Cosmic', false, {
    ...lightBase,
    bgDeep: '#eef0f5', bgPanel: 'rgba(255, 255, 255, 0.8)', bgPanelHover: 'rgba(255, 255, 255, 1)',
    borderLight: 'rgba(0, 0, 0, 0.1)', borderFocus: 'rgba(100, 120, 255, 0.4)',
    accentPrimary: '#445588', accentSecondary: '#64748b', accentBlue: '#445588', accentPurple: '#64748b'
  })
];

export const getThemeByName = (name) => {
  if (!name) return themes[0];
  if (name === 'Light' || name === 'YouTube White' || name === 'Clean White') return themes.find(t => t.name === 'Light') || themes[0];
  if (name === 'Dark' || name === 'Enterprise Navy' || name === 'Midnight') return themes.find(t => t.name === 'Dark') || themes[0];
  if (name === 'Soft Light' || name === 'Instagram Clean') return themes.find(t => t.name === 'Soft Light') || themes[0];
  return themes.find(t => t.name === name) || themes[0];
};
