# BookTube - YouTube Audiobook Player

A lightweight web application for playing YouTube audiobooks with advanced playback features. Perfect for listening to long-form content like audiobooks, podcasts, and lectures on YouTube.

https://booktube.nosocial.net

**Author:** Ivan Khvostishkov & NoSocial.Net

## Features

- 🎵 **YouTube Integration** - Play any YouTube video by ID or URL
- ⏱️ **Sleep Timer** - Set timers from 15 minutes to 3 hours with visual countdown
- 🔁 **Loop Playback** - Automatically restart videos when they end
- 📍 **Position Memory** - Resume from where you left off
- 🎲 **Random Start** - Begin playback from a random position
- 🔖 **Bookmarkable URLs** - Save and share your playback settings
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌙 **Dark Theme** - Easy on the eyes for nighttime listening

## Installation

1. Download all project files to a local directory:
    - `index.html`
    - `app.js`
    - `styles.css`

2. Open `index.html` in a modern web browser

That's it! No server setup or build process required.

## Usage

### Basic Playback

1. Enter a YouTube video ID or full URL in the input field
2. Select your desired settings:
    - **Sleep Timer**: Choose when to automatically pause playback
    - **Loop**: Enable to replay the video indefinitely
    - **Position**: Start from beginning, last saved position, or random
3. Click the Play button

### URL Parameters

BookTube supports URL parameters for bookmarking and sharing:

```
?v=VIDEO_ID&sleep=MINUTES&loop=true/false&pos=beginning/saved/random&edit=true/false
```

Examples:
- Auto-play with 30-minute timer: `?v=dQw4w9WgXcQ&sleep=30`
- Loop from saved position: `?v=dQw4w9WgXcQ&loop=true&pos=saved`
- Open in edit mode: `?v=dQw4w9WgXcQ&sleep=60&edit=true`

### Edit Mode

When playing a video, click the BookTube logo to return to the configuration screen. The URL will preserve all your settings with `edit=true`, allowing you to:
- Modify settings before replaying
- Share a pre-configured link that doesn't auto-play
- Create bookmark collections with different settings

### Sleep Timer

When active, the remaining time appears in the top-right corner:
- Fixed-width display for easy reading
- Turns red and pulses when less than 1 minute remains
- Automatically pauses playback when timer expires

## Keyboard Shortcuts

The player uses standard YouTube keyboard shortcuts:
- `Space`: Play/Pause
- `←/→`: Seek backward/forward
- `↑/↓`: Volume up/down
- `F`: Fullscreen
- `M`: Mute/Unmute

## Browser Compatibility

BookTube works best on:
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Requires JavaScript and YouTube IFrame API access.

## Privacy

BookTube is a client-side application that:
- Stores playback positions locally in your browser
- Doesn't collect or transmit any personal data
- Only connects to YouTube for video playback

## Technical Details

- **No Backend Required**: Runs entirely in the browser
- **Local Storage**: Saves playback positions per video
- **YouTube IFrame API**: Official YouTube player integration
- **Responsive CSS**: Adapts to any screen size
- **URL State Management**: All settings preserved in URL

## Use Cases

- 📚 **Audiobooks**: Listening to full-length books on YouTube
- 🎙️ **Podcasts**: Long podcast episodes with position memory
- 📖 **Educational Content**: Lectures, courses, and tutorials
- 🛌 **Sleep Stories**: Bedtime content with automatic shutoff
- 🗣️ **Language Learning**: Perfect for learning foreign language phrases
    - Use random position to hear different phrases each session
    - Set a 15-30 minute timer for daily practice
    - Loop feature helps with repetition and memorization
    - No specific order means uniform exposure to all material
- 🚗 **Road Trips**: Entertainment for long drives (passenger use only!)

## Language Learning Tips

BookTube is especially useful for language learners using YouTube phrase collections:

1. **Daily Random Practice**: Set position to "random" and timer to 15-20 minutes for daily exposure to different phrases
2. **Spaced Repetition**: The random feature naturally creates spaced repetition as you'll hear phrases at different intervals
3. **Passive Learning**: Use while commuting, exercising, or doing chores
4. **Sleep Learning**: Set a 30-45 minute timer to listen while falling asleep
5. **Bookmarkable Progress**: Create different URLs for different difficulty levels or topics

Example setup for language learning:
```
?v=PHRASE_VIDEO_ID&sleep=20&loop=true&pos=random
```

Sample YouTube videos for German language from the [German Hands-Free Trainer](https://github.com/ivan-khvostishkov/german-a1-trainer) project:

* German A1 (Start Deutsch 1): http://booktube.nosocial.net/?v=tSCrnPUt-pU&sleep=20&loop=true&pos=random&edit=true
* German A2: http://booktube.nosocial.net/?v=esvhhEGLTNA&sleep=20&loop=true&pos=random&edit=true

## Troubleshooting

**Video won't play:**
- Check if the video is available in your region
- Ensure the video ID is correct
- Try refreshing the page

**Position not saving:**
- Enable cookies/local storage in your browser
- Note: Random position mode doesn't save progress

**Sleep timer not visible:**
- Only appears when a timer is active
- Check top-right corner of the player

## License

Copyright © 2013-2025 NoSocial.Net

For support, contact: booktube@nosocial.net

## Acknowledgments

- Font Awesome for icons
- YouTube for the IFrame Player API
- All audiobook creators on YouTube

---

Enjoy your audiobooks! 📚🎧
