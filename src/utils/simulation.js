// src/utils/simulation.js
import { v4 as uuidv4 } from "uuid";

// Text-to-speech helper
function speak(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// Manufacturing workflow steps (vertical order)
const manufacturingSteps = [
  { id: "cutting", name: "Cutting", expected: 5 },
  { id: "assembly", name: "Assembly", expected: 10 },
  { id: "qa", name: "Quality Check", expected: 8 },
  { id: "packaging", name: "Packaging", expected: 6 },
  { id: "dispatch", name: "Dispatch", expected: 4 },
];

// Random deviation generator
function randomDeviation() {
  const reasons = [
    "material shortage",
    "machine fault",
    "operator break",
    "quality rework",
    "missing parts"
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export function runSimulation(updateLiveMirror, updateAnalytics, updateEventLog, updateBottleneck) {
  let logs = [];
  let totalDelay = 0;
  let bottleneckStep = null;
  let maxDelay = 0;

  let startTime = new Date();

  manufacturingSteps.forEach((step, index) => {
    let actual = step.expected + Math.floor(Math.random() * 5); // Random delay up to 4 mins
    let deviation = actual > step.expected;
    let delay = deviation ? actual - step.expected : 0;

    if (delay > maxDelay) {
      maxDelay = delay;
      bottleneckStep = step.name;
    }

    totalDelay += delay;

    // Create timestamp
    let timestamp = new Date(startTime.getTime() + index * 60000 * step.expected)
      .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    // Add to logs
    logs.push({
      id: uuidv4(),
      time: timestamp,
      event: deviation
        ? `${step.name} delayed by ${delay} mins due to ${randomDeviation()}`
        : `${step.name} completed on time`,
      operator: ["Rajesh", "Priya", "Anil", "Deepa"][index % 4],
      deviation
    });

    // Live workflow visual update
    setTimeout(() => {
      updateLiveMirror(step.id, deviation);
      speak(deviation
        ? `${step.name} delayed by ${delay} minutes`
        : `${step.name} completed on time`);
    }, index * 1500);
  });

  // Analytics update
  setTimeout(() => {
    updateAnalytics({
      efficiency: Math.max(0, 100 - (totalDelay / (manufacturingSteps.length * 2)) * 10).toFixed(1),
      totalDelay,
      bottleneck: bottleneckStep
    });

    updateBottleneck(`Bottleneck: ${bottleneckStep} (${maxDelay} min delay)`);

    // Event log update
    updateEventLog(logs);

    speak(`Simulation complete. Bottleneck found in ${bottleneckStep}.`);
  }, manufacturingSteps.length * 1500 + 500);
}
