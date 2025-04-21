export const COLORS = {
  primary: '#00FF88', // Freo green
  secondary: '#FFD700', // Freo gold
  background: {
    dark: '#0A0A0A',
    card: '#0D0D0D',
    hover: '#121212'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    accent: '#00FF88'
  },
  border: {
    primary: 'rgba(0, 255, 136, 0.2)',
    secondary: 'rgba(255, 215, 0, 0.2)'
  }
};

export const SHADOWS = {
  card: '0 0 20px rgba(0, 255, 136, 0.1)',
  hover: '0 0 15px rgba(0, 255, 136, 0.2)'
};

export const ANIMATIONS = {
  spring: {
    type: 'spring',
    stiffness: 100,
    damping: 10
  },
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }
}; 