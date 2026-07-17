/**
 * video-player.js
 * Senior Engineer Custom Plyr & YouTube API Module.
 * Initializes and manages Plyr.js players with strict white-label settings.
 */

let plyrPlayerInstance = null;

/**
 * Initializes or updates the Plyr video player for a given YouTube Video ID.
 * @param {string} youtubeVideoId The YouTube 11-character video ID.
 */
function initLessonPlayer(youtubeVideoId) {
  const playerWrapper = document.querySelector('.player-wrapper');
  if (!playerWrapper) {
    console.error("Plyr error: .player-wrapper element not found in DOM");
    return;
  }

  // 1. Clean the container to prevent any lingering iframe resource/events leaks
  playerWrapper.innerHTML = `
    <div id="player" class="plyr__video-embed">
      <iframe
        src="https://www.youtube.com/embed/${youtubeVideoId}?origin=${window.location.origin}&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1"
        allowfullscreen
        allowtransparency
        allow="autoplay"
      ></iframe>
    </div>
  `;

  // 2. Destroy any existing Plyr instance before creating a new one
  if (plyrPlayerInstance) {
    try {
      plyrPlayerInstance.destroy();
    } catch (e) {
      console.warn("Error destroying previous Plyr instance:", e);
    }
  }

  // 3. Initialize Plyr
  plyrPlayerInstance = new Plyr('#player', {
    controls: [
      'play-large',   // Large play button in center
      'play',         // Play/pause on bar
      'progress',     // Scrubber bar
      'current-time', // Time elapsed
      'duration',     // Time total
      'mute',         // Volume toggle
      'volume',       // Slider control
      'settings',     // Speed/Quality settings dropdown
      'fullscreen'    // Fullscreen toggle
    ],
    settings: ['speed'], // Support playback speeds out of the box
    speed: {
      selected: 1,
      options: [0.5, 0.75, 1, 1.25, 1.5, 2]
    },
    keyboard: {
      focused: true,
      global: true // Support play, pause, mute, seek shortcuts globally
    },
    youtube: {
      noCookie: true,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      controls: 0 // Hides default YouTube control bars entirely!
    }
  });

  return plyrPlayerInstance;
}

/**
 * Destroys any active player instance and clears the player wrapper to halt playback.
 */
function destroyLessonPlayer() {
  if (plyrPlayerInstance) {
    try {
      plyrPlayerInstance.destroy();
    } catch (e) {
      console.warn("Error destroying active player instance:", e);
    }
    plyrPlayerInstance = null;
  }

  const playerWrapper = document.querySelector('.player-wrapper');
  if (playerWrapper) {
    playerWrapper.innerHTML = '';
  }
}
