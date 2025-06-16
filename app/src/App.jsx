import { useEffect, useState } from 'react';
import './App.css';

// 21 visually distinct, soft but vibrant colors
const highlightColors = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#ffb74d', '#4dd0e1', '#a1887f', '#90a4ae', '#f06292', '#aed581', '#4fc3f7', '#ff8a65', '#9575cd', '#dce775', '#ffd740', '#b2dfdb', '#ce93d8', '#fff176', '#b0bec5', '#ffb300',
];

// Split on whitespace or Hebrew maqaf (־, U+05BE)
function splitHebrewWords(text) {
  return text.trim().split(/[\s\u05BE]+/);
}

function App() {
  const [words, setWords] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);

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

  return (
    <div style={{ direction: 'rtl', fontFamily: '"Noto Sans Hebrew", "Arial", sans-serif', padding: 24 }}>
      <h2>ישעיה נייג: חזרות</h2>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {highlights.map((group, idx) => (
          <label key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 16, color: highlightColors[idx % highlightColors.length], fontWeight: activeGroups.includes(idx) ? 'bold' : 'normal', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={activeGroups.includes(idx)}
              onChange={() => toggleGroup(idx)}
              style={{ marginLeft: 4, marginRight: 4 }}
            />
            {group.root ? `${group.root}` : `קבוצה ${idx + 1}`} 
            ({group.words ? group.words.length : 0})
          </label>
        ))}
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.3, wordBreak: 'keep-all', background: '#f9f9f9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {(() => {
          // Detect verse numbers (1-2 digits)
          const verseNumRegex = /^\d{1,2}$/;
          const elements = [];
          let idx = 0;
          while (idx < words.length) {
            const word = words[idx];
            const groupIdx = highlightMap[idx];
            const isVerseNum = verseNumRegex.test(word);
            if (isVerseNum && idx < words.length - 1) {
              // Wrap verse number and next word together
              const nextWord = words[idx + 1];
              const nextGroupIdx = highlightMap[idx + 1];
              elements.push(
                <span key={`vnum-${idx}`} style={{ display: 'inline-block', whiteSpace: 'nowrap', margin: '0 2px', verticalAlign: 'middle' }}>
                  <span
                    style={Object.assign({
                      margin: '0 2px',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    },
                      groupIdx !== undefined ? {
                        backgroundColor: highlightColors[groupIdx % highlightColors.length],
                        borderRadius: 4,
                        padding: '0 4px',
                        color: '#222',
                      } : {})}
                  >
                    {word}
                  </span>
                  <span
                    style={Object.assign({
                      margin: '0 2px',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    },
                      nextGroupIdx !== undefined ? {
                        backgroundColor: highlightColors[nextGroupIdx % highlightColors.length],
                        borderRadius: 4,
                        padding: '0 4px',
                        color: '#222',
                      } : {})}
                  >
                    {nextWord}
                  </span>
                </span>
              );
              idx += 2;
              continue;
            }
            // Regular word
            elements.push(
              <span
                key={idx}
                style={Object.assign({
                  display: 'inline-block',
                  margin: '0 2px',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                },
                  groupIdx !== undefined ? {
                    backgroundColor: highlightColors[groupIdx % highlightColors.length],
                    borderRadius: 4,
                    padding: '0 4px',
                    color: '#222',
                  } : {})}
              >
                {word}
              </span>
            );
            idx++;
          }
          return elements;
        })()}
      </div>
    </div>
  );
}

export default App;
