import React from 'react';

const Tabs = ({ menuData, currentTab, setCurrentTab }) => (
  <nav className="tabs">
    {menuData.map((category) => (
      <button
        key={category.category}
        className={`tab-button ${category.category === currentTab ? 'active' : ''}`}
        onClick={() => setCurrentTab(category.category)}
      >
        {category.category} - R${category.price}
      </button>
    ))}
  </nav>
);

export default Tabs;
