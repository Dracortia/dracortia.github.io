DRACORTIA — AUDIO DECK / LOCAL TRACKS
=====================================

1. Put your audio files in this folder (mp3, ogg, m4a or wav).
2. Open ../js/tracks.js and list them, for example:

   window.DRC_LOCAL_TRACKS = [
     { file: "music/soul-spires.mp3", title: "Soul Spires: Initium", sub: "Original score" }
   ];

3. Reload the site. Local tracks are listed before the YouTube archive and
   play even when index.html is opened directly from disk.

Keep the files reasonably small (192–320 kbps) so the site stays light.
