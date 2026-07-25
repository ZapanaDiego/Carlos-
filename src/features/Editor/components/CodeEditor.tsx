import React, { useRef, useState } from 'react';
import { useEditor } from '../hooks/useEditor';
import { LineHighlighter } from './LineHighlighter';

const CPP_KEYWORDS = [
  'int', 'float', 'double', 'char', 'bool', 'struct', 'class', 
  'if', 'else', 'while', 'for', 'return', 'new', 'delete', 'nullptr', 
  'using', 'namespace'
];

export const CodeEditor: React.FC = () => {
  const { code, currentLine, handleChange } = useEditor();
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const LINE_HEIGHT = 21; // Match line-height in CSS

  // Very basic regex highlighter
  const highlightCode = (text: string) => {
    // Escape HTML first
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Highlight keywords
    const keywordRegex = new RegExp(`\\b(${CPP_KEYWORDS.join('|')})\\b`, 'g');
    html = html.replace(keywordRegex, '<span style="color: #cba6f7;">$1</span>'); // Mauve

    // Highlight strings
    html = html.replace(/(".*?"|'.*?')/g, '<span style="color: #a6e3a1;">$1</span>'); // Green

    // Highlight numbers
    html = html.replace(/\b(\d+)\b/g, '<span style="color: #fab387;">$1</span>'); // Peach

    // std:: highlighting
    html = html.replace(/(std::cout|std::cin|std::endl)/g, '<span style="color: #89b4fa;">$1</span>'); // Blue

    // #include highlighting
    html = html.replace(/(#include)/g, '<span style="color: #f38ba8;">$1</span>'); // Red

    // Ensure empty lines render correctly in <pre>
    return html.replace(/\n$/g, '\n\n'); 
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: '10px 10px 10px 40px', // Extra left padding for line numbers
    border: 'none',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: `${LINE_HEIGHT}px`,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
      {/* Background and line numbers column */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30px',
        height: '100%',
        backgroundColor: '#181825',
        borderRight: '1px solid #313244',
        zIndex: 0
      }} />

      {/* Content wrapper handles scrolling for both layers */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        
        {/* Highlight Layer */}
        <div style={{
          ...commonStyle,
          color: '#cdd6f4',
          pointerEvents: 'none', // Let clicks pass through to textarea
          zIndex: 2,
          overflow: 'hidden', // Hide scrollbars on pre
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`
        }}>
          <LineHighlighter currentLine={currentLine} lineHeight={LINE_HEIGHT} />
          <div dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
        </div>

        {/* Editing Layer */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          style={{
            ...commonStyle,
            color: 'transparent', // Hide text, keep caret visible
            caretColor: '#cdd6f4',
            backgroundColor: 'transparent',
            resize: 'none',
            outline: 'none',
            zIndex: 3,
            overflow: 'auto'
          }}
        />
      </div>
    </div>
  );
};
