import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import fs from "fs";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "0000",
  port: 5432,
});
const app = express();
const port = 3000;

let quiz = [];

// Function to load CSV data as fallback
function loadCSVData() {
  const csv = fs.readFileSync("./capitals.csv", "utf-8");
  const lines = csv.split("\n");
  lines.forEach((line, index) => {
    if (index > 0 && line.trim()) {
      const [id, country, capital] = line.split(",");
      if (capital) {
        quiz.push({ country, capital });
      }
    }
  });
  console.log("Loaded " + quiz.length + " questions from CSV file");
}

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    console.log("Loading data from CSV file instead...");
    loadCSVData();
  } else {
    console.log("Connected to database");
    db.query("SELECT * FROM capitals", (err, res) => {
      if (err) {
        console.error("Error executing query", err.stack);
        loadCSVData();
      } else {
        quiz = res.rows;
        console.log("Loaded " + quiz.length + " questions from database");
      }
    });
  }
}); 


let totalCorrect = 0;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  console.log(currentQuestion);
  res.render("index.ejs", { question: currentQuestion });
});

// POST a new post
app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;
  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    console.log(totalCorrect);
    isCorrect = true;
  }

  nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

async function nextQuestion() {
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];

  currentQuestion = randomCountry;
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
