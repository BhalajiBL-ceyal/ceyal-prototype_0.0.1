# Ceyel Live Workflow Mirror

LiveMirror is a React-based interactive dashboard that visualizes and simulates workflows in real-time. It integrates process mining data from Firestore and provides AI-driven bottleneck explanations, workflow playback, and event logging. Designed for manufacturing and MSME processes, it offers live insights and deviation detection.

## Features
* **Live Workflow Mirror:** Vertical workflow visualization with highlighted deviations.
* **Event Log Viewer:** Real-time event tracking with delay indicators.
* **Playback Mode:** Step-by-step simulation of workflow traces with optional speech narration.
* **AI Explanation:** Identifies bottlenecks and provides textual insights.
* **Firestore Integration:** Live synchronization with workflow, event log, and simulation collections.
* **Simulation Engine:** Run manufacturing or process simulations with dynamic updates.
* **Primitive Canvas:** Interactive visualization of workflow nodes and events.
* **Deviations Highlighting:** Automatically marks steps that exceed expected durations.

## Tech Stack
* **Frontend:** React, Material UI (MUI)
* **Backend / Database:** Firebase Firestore
* **Visualization:** Custom PrimitiveCanvas component
* **Text-to-Speech:** Web Speech API
* **Simulation:** Custom JS simulation utilities

## Installation
Clone the repository:
```bash
git clone [https://github.com/](https://github.com/BhalajiBL-ceyal/live-workflow-mirror.git)
cd live-workflow-mirror
```
Install dependencies:
```bash
npm install
```
Configure Firebase:
* Create a Firebase project.
* Copy your Firebase config into `src/firebase.js`.
* Make sure Firestore collections exist for:
    * `workflows`
    * `eventlogs`
    * `simulations`

## Usage
Start the development server:
```bash
npm start
```
Open your browser at `http://localhost:3000`.

## Controls
* **Run Simulation:** Generates a sample manufacturing workflow.
* **Explain:** Shows AI-based bottleneck explanations in a modal.
* **Playback:** Plays workflow trace step-by-step with voice narration.
* **Replay:** Restarts the trace playback.
* **Volume Icon:** Triggers a quick one-line explanation.

## Folder Structure
```
src/
 ├─ components/
 │   └─ PrimitiveCanvas.jsx     # Custom workflow canvas
 ├─ pages/
 │   └─ LiveMirror.jsx         # Main page component
 ├─ utils/
 │   └─ simulation.js          # Simulation logic
 └─ firebase.js                # Firebase config
```

## Screenshots
<img width="1920" height="872" alt="image" src="https://github.com/user-attachments/assets/9a7f4fd8-cb57-4314-8310-ee68ab1d51cf" />
<img width="1920" height="868" alt="image" src="https://github.com/user-attachments/assets/3fb35cfa-8053-4b94-aba1-a557c87de9e9" />
<img width="1920" height="866" alt="image" src="https://github.com/user-attachments/assets/923a00ce-d890-4c05-8248-de6c77928d73" />




## Contributing
* Fork the repository.
* Create your feature branch: `git checkout -b feature-name`.
* Commit your changes: `git commit -m 'Add feature'`.
* Push to the branch: `git push origin feature-name`.
* Open a Pull Request.

## License
MIT License © 2025 Ceyel
