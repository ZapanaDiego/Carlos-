import React from 'react';

interface LineHighlighterProps {
  currentLine: number; // 1-indexed
  lineHeight: number;
}

export const LineHighlighter: React.FC<LineHighlighterProps> = ({ currentLine, lineHeight }) => {
  if (currentLine <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${(currentLine - 1) * lineHeight}px`,
        left: 0,
        right: 0,
        height: `${lineHeight}px`,
        backgroundColor: 'rgba(137, 180, 250, 0.2)', // translucent blue
        borderLeft: '3px solid #89b4fa',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};
