export interface SampleQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  subject: string;
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: "q1",
    text: "What is 7 x 8?",
    options: ["48", "54", "56", "63"],
    correctIndex: 2,
    subject: "MATH",
  },
  {
    id: "q2",
    text: "What planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    correctIndex: 1,
    subject: "SCIENCE",
  },
  {
    id: "q3",
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    subject: "GEOGRAPHY",
  },
  {
    id: "q4",
    text: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIndex: 1,
    subject: "MATH",
  },
  {
    id: "q5",
    text: "What gas do plants breathe in?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correctIndex: 2,
    subject: "SCIENCE",
  },
  {
    id: "q6",
    text: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    subject: "GEOGRAPHY",
  },
  {
    id: "q7",
    text: "What is 12 x 12?",
    options: ["124", "134", "144", "154"],
    correctIndex: 2,
    subject: "MATH",
  },
  {
    id: "q8",
    text: "Which organ pumps blood?",
    options: ["Brain", "Lungs", "Heart", "Liver"],
    correctIndex: 2,
    subject: "SCIENCE",
  },
  {
    id: "q9",
    text: "What is the plural of child?",
    options: ["Childs", "Children", "Childes", "Childies"],
    correctIndex: 1,
    subject: "ENGLISH",
  },
  {
    id: "q10",
    text: "Who built the pyramids?",
    options: ["Romans", "Greeks", "Egyptians", "Chinese"],
    correctIndex: 2,
    subject: "HISTORY",
  },
];
