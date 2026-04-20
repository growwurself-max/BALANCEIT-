# Balance It! - Physics Puzzle Game

A modern, physics-based weight balancing puzzle game with smooth animations and engaging gameplay.

## 🎮 Game Features

- **Physics-Based Gameplay**: Realistic scale balancing with smooth animations
- **Visual Weight Placement**: See weights stack on the scale as you add them
- **Progressive Difficulty**: 50 levels with increasing challenge
- **Animated Feedback**: Scale tilts and balances with physics-like motion
- **Sound Effects**: Audio feedback for all interactions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Gradient effects, glowing elements, and smooth transitions

## 🎯 How to Play

1. **Start**: The scale begins unbalanced with a hidden weight on the left
2. **Balance**: Add 1kg, 2kg, 5kg, and 10kg weights to the right side
3. **Perfect Match**: Find the exact weight to balance the scale perfectly
4. **Progress**: Complete levels to unlock more challenging puzzles

## 🎨 Visual Design

- **Neon Theme**: Blue and purple neon color scheme
- **Physics Animations**: Smooth beam tilting and balancing
- **Weight Blocks**: Color-coded weight blocks that stack visually
- **Particle Effects**: Glowing elements and smooth transitions
- **Modern Typography**: Clean, readable fonts with gradient text effects



## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Click "Play Game" to start
3. Select a level to begin balancing
4. Add weights and submit when you think it's balanced

## 🎵 Audio System

The game uses Web Audio API to generate sound effects:
- **Place Weight**: High-pitched tone when adding weights
- **Remove Weight**: Low-pitched tone when removing weights
- **Success**: Musical chord progression for correct answers
- **Failure**: Descending tone for incorrect answers

## 📱 Mobile Support

- Touch-optimized controls
- Responsive layout for all screen sizes
- Prevents zoom on input focus
- Optimized button sizes for touch

## 🏆 Scoring System

- **Base Points**: 100 points for correct balance
- **Time Bonus**: +20 points for solving under 10 seconds
- **Hint Penalty**: -20 points for using hints
- **Slow Penalty**: -10 points for taking over 30 seconds

## 🔧 Browser Requirements

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Any modern mobile browser

## 🎮 Game Flow

```
Start Screen → Level Selection → Countdown → Gameplay → Result → Next Level
```

## 💾 Data Storage

- **High Score**: Stored in localStorage
- **Completed Levels**: Progress tracking
- **Settings**: User preferences

## 🎨 Customization

The game uses CSS custom properties for easy theming:
- `--neon-blue`: Primary accent color
- `--neon-purple`: Secondary accent color
- `--bg-primary`: Main background
- `--text-primary`: Primary text color

## 🐛 Known Issues

- Audio may not work in some browsers due to autoplay restrictions
- Very old browsers may not support CSS transforms

## 📄 License

This game is provided as-is for educational and entertainment purposes.
- Modular code structure
- Error handling and graceful degradation
- Clean, commented code
- Mobile-first responsive design

## License

This game is provided as-is for educational and commercial use. Please ensure compliance with Adsterra and Firebase terms of service when deploying.