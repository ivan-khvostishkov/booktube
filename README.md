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
- 📝 **Custom Titles** - Set personalized titles for your audiobooks
- 📋 **Playlist Support** - Play YouTube playlists or multiple videos in sequence
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌙 **Dark Theme** - Easy on the eyes for nighttime listening

## Usage

Some sample audiobooks to start with:

* [The Bhagavad Gita, The Lord's Song](https://booktube.nosocial.net/?v=IIEJNUO1BoQ&sleep=15&loop=false&pos=saved&title=The+Bhagavad+Gita%2C+The+Lord%27s+Song&edit=true)
* [The Stories of Mahabharata](https://booktube.nosocial.net/?v=PLAQ6vzFKj_1uqRv3OCX-Elexz9C8vfENs&sleep=30&loop=false&pos=saved&title=The+Stories+of+Mahabharata&edit=true)
* [Siddhartha by Hermann Hesse](https://booktube.nosocial.net/?v=vS4ble0Uznk&sleep=30&loop=false&pos=saved&title=Siddhartha+By+Hermann+Hesse&edit=true)
* [The Glass Bead Game by Hermann Hesse (in German)](https://booktube.nosocial.net/?v=PLe7ZwSHgdjYJdfNOkOrHznkN2yyT5eJpm&sleep=30&loop=false&pos=saved&title=Das+Glasperlenspiel+von+Hermann+Hesse&edit=true)
* [The Epic Of Gilgamesh](https://booktube.nosocial.net/?v=X35eeaG9W98&sleep=30&loop=false&pos=saved&title=The+Epic+Of+Gilgamesh&edit=true)
* [The Master and Margarita by Mikhail Bulgakov](https://booktube.nosocial.net/?v=PL-lY2fdb59Of61NGdOmXUagd0f1B_RUXC&sleep=30&loop=false&pos=saved&title=The+Master+and+Margarita+by+Mikhail+Bulgakov&edit=true)

### Basic Playback

0. Navigate to https://booktube.nosocial.net/

1. Enter a YouTube video ID, full URL, or playlist ID in the input field
2. Optionally set a custom title for your audiobook
3. For playlists, use a YouTube playlist ID (PLxxx) or add multiple video IDs separated by spaces
4. Select your desired settings:
    - **Sleep Timer**: Choose when to automatically pause playback
    - **Loop**: Enable to replay the video indefinitely
    - **Position**: Start from beginning, last saved position, or random
5. Click the Play button

### URL Parameters

BookTube supports URL parameters for bookmarking and sharing:

```
?v=VIDEO_ID_OR_PLAYLIST&title=CUSTOM_TITLE&sleep=MINUTES&loop=true/false&pos=beginning/saved/random&edit=true/false
```

Examples:
- Auto-play with custom title (30-minute timer): `?v=dQw4w9WgXcQ&title=My%20Audiobook&sleep=30`
- YouTube playlist: `?v=PLe7ZwSHgdjYJdfNOkOrHznkN2yyT5eJpm&loop=true`
- Multiple videos: `?v=dQw4w9WgXcQ abc123def xyz789ghi&loop=true`
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

* German A1 (Start Deutsch 1): https://booktube.nosocial.net/?v=tSCrnPUt-pU&sleep=20&loop=true&pos=random&edit=true
* German A2: https://booktube.nosocial.net/?v=esvhhEGLTNA&sleep=20&loop=true&pos=random&edit=true

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
