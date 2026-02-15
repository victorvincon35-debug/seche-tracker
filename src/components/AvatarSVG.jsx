export default function AvatarSVG({ stage, size = 180 }) {
  const s = stage, cx = 60, headY = 22;
  return (
    <svg viewBox="0 0 120 160" width={size} height={size * 1.33}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="30%"><stop offset="0%" stopColor={s.color} /><stop offset="100%" stopColor={`${s.color}dd`} /></radialGradient>
        <linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.shorts} /><stop offset="100%" stopColor={`${s.shorts}aa`} /></linearGradient>
      </defs>
      <rect x={cx-s.legWidth-3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="38;40;38" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx+3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="40;38;40" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx-s.chestWidth/2+2} y={100} width={s.chestWidth-4} height={22} rx={4} fill="url(#shg)" />
      <path d={`M${cx-s.chestWidth/2},${55} Q${cx-s.chestWidth/2-2},${80} ${cx-s.bodyWidth/2},${105} L${cx+s.bodyWidth/2},${105} Q${cx+s.chestWidth/2+2},${80} ${cx+s.chestWidth/2},${55} Z`} fill="url(#sg)" />
      {s.sixpack>=2&&<><line x1={cx} y1={65} x2={cx} y2={98} stroke={`${s.color}88`} strokeWidth="0.8"/><line x1={cx-8} y1={75} x2={cx+8} y2={75} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=4&&<><line x1={cx-8} y1={83} x2={cx+8} y2={83} stroke={`${s.color}88`} strokeWidth="0.5"/><line x1={cx-7} y1={91} x2={cx+7} y2={91} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=6&&<line x1={cx-6} y1={98} x2={cx+6} y2={98} stroke={`${s.color}88`} strokeWidth="0.5"/>}
      <ellipse cx={cx-s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <ellipse cx={cx+s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <rect x={cx-s.chestWidth/2-s.armWidth+2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(-8,${cx-s.chestWidth/2},55)`}><animate attributeName="y" values="55;53;55" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx+s.chestWidth/2-2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(8,${cx+s.chestWidth/2},55)`}><animate attributeName="y" values="53;55;53" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx-6} y={35} width={12} height={22} rx={6} fill="url(#sg)" />
      <circle cx={cx} cy={headY} r={16} fill="url(#sg)" />
      <path d={`M${cx-14},${headY-6} Q${cx-16},${headY-16} ${cx-6},${headY-18} Q${cx},${headY-20} ${cx+6},${headY-18} Q${cx+16},${headY-16} ${cx+14},${headY-6}`} fill="#2a1a0a"/>
      <circle cx={cx-5} cy={headY-1} r={2} fill="#1a1a2e"/><circle cx={cx+5} cy={headY-1} r={2} fill="#1a1a2e"/>
      <circle cx={cx-4.5} cy={headY-1.5} r={0.6} fill="white"/><circle cx={cx+5.5} cy={headY-1.5} r={0.6} fill="white"/>
      <path d={`M${cx-4},${headY+5} Q${cx},${headY+5+s.sixpack} ${cx+4},${headY+5}`} fill="none" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx={cx-s.legWidth/2-3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/><ellipse cx={cx+s.legWidth/2+3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/>
    </svg>
  );
}
