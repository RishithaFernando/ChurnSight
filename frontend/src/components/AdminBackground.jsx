import React from 'react';

export default function AdminBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 240,
      right: 0,
      bottom: 0,
      zIndex: 0,
      background: '#f8fafc',
      pointerEvents: 'none'
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <polygon
          points="650,0 1200,0 1200,900 0,900"
          fill="#0f172a"
        />
      </svg>
    </div>
  )
}
