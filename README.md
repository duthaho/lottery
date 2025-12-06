# Lottery

A bilingual (English/Vietnamese) lottery web application for live event prize drawings. Features a slot-machine style card carousel animation, winner tracking, and full admin controls.

## Features

- **5-Card Carousel** - Displays participants in a visual carousel format
- **Slot Machine Animation** - Exciting spin animation with natural deceleration
- **Bilingual Support** - Toggle between English and Vietnamese
- **Winner Tracking** - Sidebar shows all winners with their prizes
- **Auto-Save** - State persists in localStorage, survives page refresh
- **Admin Panel** - Import data, undo draws, reset, export state
- **Confetti Celebration** - Visual celebration when winner is revealed
- **Keyboard Shortcut** - Press Spacebar to draw

## Quick Start

### 1. Serve the Application

The app uses ES modules, so it requires a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

### 2. Open in Browser

Navigate to `http://localhost:8000`

### 3. Start Drawing!

- Click the **DRAW** button or press **Spacebar**
- Watch the slot machine animation
- Winner is revealed with confetti celebration

## Project Structure

```
lottery/
├── index.html              # Main HTML structure
├── css/
│   └── style.css           # All styles (~500 lines)
├── js/
│   ├── app.js              # Main entry point
│   ├── carousel.js         # Card carousel & animation
│   ├── draw.js             # Draw orchestration
│   ├── prizes.js           # Prize queue management
│   ├── winners.js          # Winner tracking & display
│   ├── storage.js          # localStorage persistence
│   ├── i18n.js             # Translations (EN/VI)
│   ├── admin.js            # Admin panel controls
│   └── confetti.js         # Celebration effects
├── data/
│   ├── participants.json   # Participant list
│   └── prizes.json         # Prize configuration
└── docs/
    └── implementation-plan.md
```

## Configuration

### Participants (`data/participants.json`)

```json
[
  { "id": "A001", "name": "Nguyen Van A" },
  { "id": "A002", "name": "Tran Thi B" },
  { "id": "A003", "name": "Le Van C" }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (displayed prominently) |
| `name` | string | Participant name |

### Prizes (`data/prizes.json`)

```json
[
  {
    "id": 1,
    "name": "Grand Prize",
    "name_vi": "Giai Dac Biet",
    "quantity": 1
  },
  {
    "id": 2,
    "name": "Second Prize",
    "name_vi": "Giai Nhi",
    "quantity": 2
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Prize ID (lower = higher priority) |
| `name` | string | Prize name in English |
| `name_vi` | string | Prize name in Vietnamese (optional) |
| `quantity` | number | Number of this prize to award |

**Note**: Prizes are awarded in reverse order (highest ID first → lowest ID last), so the Grand Prize (ID 1) is drawn last for maximum suspense.

## Usage Guide

### Basic Controls

| Action | Method |
|--------|--------|
| Draw | Click "DRAW" button or press Spacebar |
| Switch Language | Click EN/VI toggle in header |
| Open Admin | Click "Admin" button in header |

### Admin Panel

Access the admin panel by clicking "Admin" in the header.

| Function | Description |
|----------|-------------|
| **Import Participants** | Load new participant list from JSON file |
| **Import Prizes** | Load new prize configuration from JSON file |
| **Undo Last** | Reverse the most recent draw |
| **Export State** | Download current state as JSON |
| **Reset All** | Clear all progress and start over |
| **Re-add to Pool** | Return a specific winner to the participant pool |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Trigger draw (when not in admin panel) |
| `Escape` | Close admin panel |

## State Persistence

The application automatically saves state to localStorage:

- Current language preference
- Remaining participants
- Prize progress (which prize is next)
- Winner list with prizes
- Original data for reset

**Recovery**: If the page is accidentally refreshed during an event, all progress is preserved.

**Reset**: Use the admin panel "Reset All" button to clear saved state.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires ES6 module support.

## Customization

### Changing Colors

Edit CSS variables in `css/style.css`:

```css
:root {
  --color-bg: #0f172a;           /* Background */
  --color-surface: #1e293b;       /* Card/panel background */
  --color-primary: #3b82f6;       /* Primary accent (blue) */
  --color-accent: #f59e0b;        /* Secondary accent (amber) */
  --color-text: #f8fafc;          /* Main text */
}
```

### Adding Languages

Edit `js/i18n.js` to add new translations:

```javascript
const translations = {
  en: { /* English strings */ },
  vi: { /* Vietnamese strings */ },
  // Add new language:
  ja: {
    title: 'ラッキードロー',
    draw: '抽選',
    // ... other strings
  }
};
```

### Animation Duration

Edit `js/carousel.js` to change spin duration:

```javascript
// In spin() method, change duration parameter (milliseconds)
const winner = await this.carousel.spin(4000); // 4 seconds
```

## Security

The application includes security measures:

- **XSS Prevention**: All user data rendered via `textContent` (not `innerHTML`)
- **Input Validation**: Imported JSON validated for types and sizes
- **File Size Limits**: JSON imports limited to 1MB
- **Bounds Checking**: State restoration validates index ranges

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with vanilla JavaScript for maximum compatibility and zero dependencies.
