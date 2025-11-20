# Google Antigravity test

<img width="1568" height="1123" alt="Screenshot 2025-11-20 at 15 11 04" src="https://github.com/user-attachments/assets/fb5e0bdd-3ac4-4dc3-9900-a48ef41a6217" />


Done in around 20 minutes from start to finish this antigravity-developed prototype app does live transcription from a mic.

It also uses the Realtime API to conduct a speech-to-speech conversation. Not exactly what I was after but a decent start. I urged it to use WebRTC instead of websockets for thw Realtime API, and to use Tailwind, Vue, Vite and Yarn out of my own preference. 

If you want to get it to run, clone it, add VITE_OPENAI_API_KEY to an .env file on the root withh your own key [BEWARE THIS IS EXPOSED CLIENT SIDE FOR NOW. IN PRODUCTION MOVE IT SERVER-SIDE!!]], run yarn, and then yarn dev. 
