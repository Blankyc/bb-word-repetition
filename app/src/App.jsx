import { useEffect, useState, useMemo } from 'react';
import './App.css';
import { scaleOrdinal } from 'd3-scale';
import { schemeSet3, schemeCategory10, schemePaired, schemeSet1, schemeSet2 } from 'd3-scale-chromatic';

// Create a color scale that supports 31+ groups
// Utility to shuffle an array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}
// Generate a large, shuffled categorical palette
function getColorPalette(n) {
  let base = [
    ...schemeSet3,
    ...schemePaired,
    ...schemeSet1,
    ...schemeSet2,
    ...schemeCategory10
  ];
  base = shuffle(base);
  // If more colors are needed, generate by adjusting lightness
  while (base.length < n) {
    base = base.concat(base.map(hex => {
      // Slightly darken or lighten
      let c = hex.replace('#', '');
      let r = parseInt(c.substring(0,2),16), g = parseInt(c.substring(2,4),16), b = parseInt(c.substring(4,6),16);
      r = Math.min(255, Math.floor(r * 0.85 + 30));
      g = Math.min(255, Math.floor(g * 0.85 + 30));
      b = Math.min(255, Math.floor(b * 0.85 + 30));
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }));
  }
  return base.slice(0, n);
}

// Load Google Fonts for Noto Sans Hebrew
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700;900&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Split on whitespace and maqaf, but group maqaf-linked words for rendering
function splitHebrewWordsWithMaqafGroups(text) {
  // Split on whitespace to get verse tokens
  const verseTokens = text.trim().split(/\s+/);
  // For each token, split on maqaf, but keep maqaf as a separate token
  const maqaf = '\u05BE';
  let words = [];
  let maqafGroups = [];
  let currentGroup = [];
  let wordIdx = 0;
  for (const token of verseTokens) {
    // Split on maqaf, but keep maqaf as a separate token
    const parts = token.split(new RegExp(`(${maqaf}|־)`, 'g')).filter(Boolean);
    let group = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === maqaf || part === '־') {
        group.push({ word: part, idx: null, isMaqaf: true });
      } else {
        group.push({ word: part, idx: wordIdx, isMaqaf: false });
        wordIdx++;
      }
    }
    if (group.length > 0) maqafGroups.push(group);
  }
  // Flatten for highlights
  words = maqafGroups.flat().filter(w => !w.isMaqaf);
  return { words, maqafGroups };
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
  const [maqafGroups, setMaqafGroups] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [showAnim, setShowAnim] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  // Load verses.txt and highlights.json
  useEffect(() => {
    fetch('/verses.txt')
      .then(res => res.text())
      .then(text => {
        const { words, maqafGroups } = splitHebrewWordsWithMaqafGroups(text);
        setWords(words);
        setMaqafGroups(maqafGroups);
      });
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

  // Use a color palette based on the number of groups
  const highlightColors = useMemo(() => getColorPalette(highlights.length || 31), [highlights.length]);

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
            marginLeft: 4,
            color: highlightColors[idx % highlightColors.length],
            fontWeight: activeGroups.includes(idx) ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            background: '#fff',
            borderRadius: 4,
            padding: '2px 5px',
            boxShadow: (activeGroups.includes(idx) || hoveredGroup === idx) ? `0 0 0 1px ${highlightColors[idx % highlightColors.length]}` : 'none',
            border: hoveredGroup === idx ? `1.25px solid ${darkenColor(highlightColors[idx % highlightColors.length], 60)}` : activeGroups.includes(idx) ? `1px solid ${highlightColors[idx % highlightColors.length]}` : '1.0px solid #eee',
            transition: 'box-shadow 0.2s, border 0.2s',
            filter: hoveredGroup === idx ? 'brightness(1.1)' : 'none',
          }}
          onMouseOver={activeGroups.includes(idx) ? () => setHoveredGroup(idx) : undefined}
          onMouseOut={activeGroups.includes(idx) ? () => setHoveredGroup(null) : undefined}
          >
            <input
              type="checkbox"
              checked={activeGroups.includes(idx)}
              onChange={() => toggleGroup(idx)}
              style={{ marginLeft: 3, marginRight: 1 }}
              aria-label={`הצג קבוצה ${group.root || idx + 1}`}
            />
            <span style={{ fontWeight: 700 }}>{group.root ? `${group.root}` : `קבוצה ${idx + 1}`}</span>
            <span style={{
              display: 'inline-block',
              background: highlightColors[idx % highlightColors.length],
              color: '#fff',
              borderRadius: 8,
              fontSize: 11,
              marginRight: 5,
              minWidth: 6,
              textAlign: 'center',
              fontWeight: 700,
              padding: '0 5px',
              lineHeight: '15px',
              boxShadow: '0 1px 4px ' + highlightColors[idx % highlightColors.length] + '33',
            }}>{group.words ? group.words.length : 0}</span>
          </label>
        ))}
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.3, wordBreak: 'keep-all', background: '#f9f9f9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', letterSpacing: '0.04em' }}>
        {maqafGroups.length > 0 ? maqafGroups.map((group, gIdx) => (
          <span key={gIdx} style={{ display: 'inline-block', whiteSpace: group.length > 1 ? 'nowrap' : undefined, marginRight: gIdx !== 0 ? '0.2em' : 0 }}>
            {group.map(({ word, idx, isMaqaf }, i) => {
              if (isMaqaf) {
                // Render maqaf as its own span, never highlighted
                return <span key={`maqaf-${gIdx}-${i}`} style={{ display: 'inline-block', margin: '0 0px', userSelect: 'none' }}>־</span>;
              }
              const groupIdx = highlightMap[idx];
              const isVerseNum = verseNumRegex.test(word);
              if (isVerseNum) {
                return (
                  <span key={`vnum-${idx}`} style={{ fontSize: 16, color: '#888', fontWeight: 700, margin: '0 4px', verticalAlign: 'middle' }} aria-label={`מספר פסוק ${word}`}>
                    {word}
                  </span>
                );
              }
              const isHovered = groupIdx !== undefined && hoveredGroup === groupIdx;
              return (
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
            })}
          </span>
        )) : null}
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
