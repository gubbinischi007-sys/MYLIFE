import React from 'react';
import Icon from './Icons';

export default function Navigation({ activePage, onNavigate, isMenuOpen, onCloseMenu }) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'personal', label: 'Personal' },
    { id: 'college', label: 'College' },
    { id: 'money', label: 'Money' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav id="n" className="bot-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              data-go={item.id}
              className={isActive ? 'on' : ''}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.id} size={22} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Slide-out Drawer Menu */}
      {isMenuOpen && (
        <div id="mn" style={{ display: 'block' }} onClick={onCloseMenu}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Top row */}
            <div className="i" style={{ border: 0, padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="MyLife" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
                <h2 style={{ margin: 0 }}>MYLIFE</h2>
              </div>
              <button
                className="bk"
                onClick={onCloseMenu}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Menu Links */}
            <div style={{ marginTop: '12px', flex: 1 }}>
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <a
                    key={item.id}
                    className="t"
                    tabIndex={0}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMenu();
                    }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '14px 4px',
                      borderBottom: '1px solid var(--l)',
                      fontWeight: isActive ? 700 : 400
                    }}
                  >
                    <Icon name={item.id} size={22} />
                    {item.label}
                  </a>
                );
              })}
            </div>

            {/* Settings Link at bottom */}
            <a
              className="t"
              tabIndex={0}
              onClick={() => {
                onNavigate('settings');
                onCloseMenu();
              }}
              style={{
                marginTop: 'auto',
                padding: '14px 4px',
                borderTop: '1px solid var(--t)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                fontWeight: activePage === 'settings' ? 700 : 400
              }}
            >
              <Icon name="settings" size={22} />
              Settings
            </a>
          </div>
        </div>
      )}
    </>
  );
}
