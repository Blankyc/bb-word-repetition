import { useEffect, useState } from 'react';
import './App.css';

// 21 visually distinct, soft but vibrant colors
const highlightColors = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#ffb74d', '#4dd0e1', '#a1887f', '#90a4ae', '#f06292', '#aed581', '#4fc3f7', '#ff8a65', '#9575cd', '#dce775', '#ffd740', '#b2dfdb', '#ce93d8', '#fff176', '#b0bec5', '#ffb300',
];

// Load Google Fonts for Noto Sans Hebrew
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700;900&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Split on whitespace or Hebrew maqaf (־, U+05BE)
function splitHebrewWords(text) {
  return text.trim().split(/[\s\u05BE]+/);
}

// Utility to darken a hex color
function darkenColor(hex, amount = 40) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0,2), 16);
  let g = parseInt(hex.substring(2,4), 16);
  let b = parseInt(hex.substring(4,6), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function App() {
  const [words, setWords] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [showAnim, setShowAnim] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Load verses.txt and highlights.json
  useEffect(() => {
    fetch('/verses.txt')
      .then(res => res.text())
      .then(text => setWords(splitHebrewWords(text)));
    fetch('/highlights.json')
      .then(res => res.json())
      .then(data => {
        setHighlights(data.highlights || []);
        setActiveGroups(Array.isArray(data.highlights) ? data.highlights.map((_, i) => i) : []);
      });
  }, []);

  // Animation on highlight toggle
  useEffect(() => {
    setShowAnim(true);
    const t = setTimeout(() => setShowAnim(false), 400);
    return () => clearTimeout(t);
  }, [activeGroups]);

  // Build a map: word index -> group index
  const highlightMap = {};
  highlights.forEach((group, groupIdx) => {
    if (activeGroups.includes(groupIdx)) {
      (group.words || []).forEach(([word, idx]) => {
        highlightMap[idx] = groupIdx;
      });
    }
  });

  // Toggle group filter
  const toggleGroup = (idx) => {
    setActiveGroups((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Select/Clear all
  const selectAll = () => setActiveGroups(highlights.map((_, i) => i));
  const clearAll = () => setActiveGroups([]);

  // Detect verse numbers (1-2 digits)
  const verseNumRegex = /^\d{1,2}$/;

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Noto Sans Hebrew, Arial, sans-serif', padding: 24, background: '#faf9f6', minHeight: '100vh' }}>
      <h2 style={{ letterSpacing: '0.04em' }}>ישעיה נייג: חזרות</h2>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button onClick={selectAll} style={{ marginLeft: 8, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ffd54f', fontWeight: 700, cursor: 'pointer' }}>בחר הכל</button>
        <button onClick={clearAll} style={{ marginLeft: 8, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#e57373', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>נקה הכל</button>
        {highlights.map((group, idx) => (
          <label key={idx} style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: 8,
            color: highlightColors[idx % highlightColors.length],
            fontWeight: activeGroups.includes(idx) ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            background: '#fff',
            borderRadius: 4,
            padding: '2px 8px',
            boxShadow: (activeGroups.includes(idx) || hoveredGroup === idx) ? `0 0 0 1px ${highlightColors[idx % highlightColors.length]}` : 'none',
            border: hoveredGroup === idx ? `1.25px solid ${darkenColor(highlightColors[idx % highlightColors.length], 60)}` : activeGroups.includes(idx) ? `1px solid ${highlightColors[idx % highlightColors.length]}` : '1.0px solid #eee',
            transition: 'box-shadow 0.2s, border 0.2s',
            filter: hoveredGroup === idx ? 'brightness(1.1)' : 'none',
          }}>
            <input
              type="checkbox"
              checked={activeGroups.includes(idx)}
              onChange={() => toggleGroup(idx)}
              style={{ marginLeft: 4, marginRight: 4 }}
              aria-label={`הצג קבוצה ${group.root || idx + 1}`}
            />
            <span style={{ fontWeight: 700 }}>{group.root ? `${group.root}` : `קבוצה ${idx + 1}`}</span>
            <span style={{
              display: 'inline-block',
              background: highlightColors[idx % highlightColors.length],
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              marginRight: 6,
              marginLeft: 4,
              minWidth: 22,
              textAlign: 'center',
              fontWeight: 700,
              padding: '0 7px',
              lineHeight: '20px',
              boxShadow: '0 1px 4px ' + highlightColors[idx % highlightColors.length] + '33',
            }}>{group.words ? group.words.length : 0}</span>
          </label>
        ))}
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.3, wordBreak: 'keep-all', background: '#f9f9f9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', letterSpacing: '0.04em' }}>
        {(() => {
          const elements = [];
          let idx = 0;
          while (idx < words.length) {
            const word = words[idx];
            const groupIdx = highlightMap[idx];
            const isVerseNum = verseNumRegex.test(word);
            if (isVerseNum) {
              // Verse number: small and gray
              elements.push(
                <span key={`vnum-${idx}`} style={{ fontSize: 16, color: '#888', fontWeight: 700, margin: '0 4px', verticalAlign: 'middle' }} aria-label={`מספר פסוק ${word}`}>
                  {word}
                </span>
              );
              idx++;
              continue;
            }
            // Regular word
            const isHovered = groupIdx !== undefined && hoveredGroup === groupIdx;
            elements.push(
              <span
                key={idx}
                className={groupIdx !== undefined ? `highlighted-word${showAnim ? ' anim' : ''}` : ''}
                style={Object.assign({
                  display: 'inline-block',
                  margin: '0 2px',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  transition: 'background 0.3s, color 0.3s',
                  letterSpacing: '0.04em',
                  cursor: groupIdx !== undefined ? 'pointer' : 'default',
                  outline: isHovered ? `2px solid ${darkenColor(highlightColors[groupIdx % highlightColors.length], 60)}` : 'none',
                  boxShadow: isHovered ? `0 0 0 4px ${highlightColors[groupIdx % highlightColors.length]}55` : 'none',
                  filter: isHovered ? 'brightness(1.1)' : 'none',
                  zIndex: isHovered ? 1 : 'auto',
                },
                  groupIdx !== undefined ? {
                    backgroundColor: highlightColors[groupIdx % highlightColors.length],
                    color: '#222',
                  } : {})}
                tabIndex={groupIdx !== undefined ? 0 : -1}
                aria-label={groupIdx !== undefined ? `הדגשה: ${highlights[groupIdx]?.root || groupIdx + 1}` : undefined}
                onMouseOver={e => {
                  if (groupIdx !== undefined) {
                    setHoveredGroup(groupIdx);
                  }
                }}
                onMouseOut={e => {
                  if (groupIdx !== undefined) {
                    setHoveredGroup(null);
                  }
                }}
              >
                {word}
              </span>
            );
            idx++;
          }
          return elements;
        })()}
      </div>
      <style>{`
        .highlighted-word.anim {
          animation: fadeInHighlight 0.4s;
        }
        @keyframes fadeInHighlight {
          from { filter: brightness(1.5); }
          to { filter: brightness(1); }
        }
        .highlighted-word:hover {
          outline: 2px solid #3333;
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

export default App;
