import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConceptualStore, TopicCategory } from '../../../store/conceptualStore';
import { TOPICS_CATALOG, CATEGORY_LABELS } from '../data/topicsCatalog';

export const SidebarMenu: React.FC = () => {
  const navigate = useNavigate();
  const { activeTopicId, expandedCategories, setActiveTopic, toggleCategory } = useConceptualStore();

  const handleTopicClick = (topicId: string) => {
    setActiveTopic(topicId);
  };

  const handleCategoryToggle = (category: TopicCategory) => {
    toggleCategory(category);
  };

  // Group topics by category
  const groupedTopics = TOPICS_CATALOG.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<TopicCategory, typeof TOPICS_CATALOG>);

  return (
    <div style={{
      width: '300px',
      backgroundColor: '#181825',
      borderRight: '1px solid #313244',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Back Button */}
      <div 
        style={{ 
          padding: '20px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          borderBottom: '1px solid #313244',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }} 
        onClick={() => navigate('/')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#313244'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ fontSize: '1.5rem' }}>⬅️</span>
        <h2 style={{ margin: 0, color: '#a6e3a1', fontSize: '1.2rem' }}>Volver al Home</h2>
      </div>
      
      {/* Scrollable Categories List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {(Object.keys(CATEGORY_LABELS) as TopicCategory[]).map((category) => {
          const isExpanded = expandedCategories[category];
          const topics = groupedTopics[category] || [];

          return (
            <div key={category} style={{ marginBottom: '8px' }}>
              {/* Category Header (Accordion Toggle) */}
              <div 
                onClick={() => handleCategoryToggle(category)}
                style={{
                  padding: '10px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? '#313244' : 'transparent',
                  color: isExpanded ? '#89b4fa' : '#bac2de',
                  fontWeight: isExpanded ? 'bold' : 'normal',
                  userSelect: 'none',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(49, 50, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{CATEGORY_LABELS[category]}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>

              {/* Category Items */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {topics.map((topic) => {
                    const isActive = activeTopicId === topic.id;
                    
                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleTopicClick(topic.id)}
                        style={{
                          padding: '8px 20px 8px 40px',
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#45475a' : 'transparent',
                          color: isActive ? '#cdd6f4' : '#a6adc8',
                          borderLeft: isActive ? '3px solid #89b4fa' : '3px solid transparent',
                          fontSize: '0.9rem',
                          transition: 'background-color 0.2s, color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'rgba(69, 71, 90, 0.4)';
                            e.currentTarget.style.color = '#cdd6f4';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#a6adc8';
                          }
                        }}
                      >
                        {topic.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
