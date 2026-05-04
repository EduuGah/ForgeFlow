// scripts/downloadExerciseGifs.js

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.EXERCISEDB_API_KEY;
const API_URL = process.env.EXERCISEDB_API_URL || "https://exercisedb.p.rapidapi.com";

const BASE_OUTPUT_DIR = path.resolve("public/exercise-media");

const exerciseGroups = {
  back: [
    { fileName: "pull-up.gif", id: "0651" },
    { fileName: "chin-up.gif", id: "1326" },
    { fileName: "lat-pulldown.gif", id: "0150" },
    { fileName: "close-grip-lat-pulldown.gif", id: "0192" },
    { fileName: "seated-cable-row.gif", id: "0213" },
    { fileName: "barbell-bent-over-row.gif", id: "0027" },
    { fileName: "dumbbell-row.gif", id: "0292" },
    { fileName: "t-bar-row.gif", id: "0606" },
    { fileName: "deadlift.gif", id: "0032" },
    { fileName: "rack-pull.gif", id: "0788" },
    { fileName: "straight-arm-pulldown.gif", id: "0199" },
    { fileName: "back-extension.gif", id: "0117" },
  ],

  shoulders: [
    { fileName: "barbell-shoulder-press.gif", id: "0041" },
    { fileName: "dumbbell-shoulder-press.gif", id: "0405" },
    { fileName: "arnold-press.gif", id: "2137" },
    { fileName: "dumbbell-lateral-raise.gif", id: "0334" },
    { fileName: "cable-lateral-raise.gif", id: "0178" },
    { fileName: "front-raise.gif", id: "0310" },
    { fileName: "rear-delt-fly.gif", id: "0380" },
    { fileName: "face-pull.gif", id: "0128" },
    { fileName: "upright-row.gif", id: "0118" },
    { fileName: "shrug.gif", id: "0406" },
  ],

  biceps: [
    { fileName: "barbell-curl.gif", id: "0023" },
    { fileName: "ez-bar-curl.gif", id: "0447" },
    { fileName: "dumbbell-curl.gif", id: "0294" },
    { fileName: "incline-dumbbell-curl.gif", id: "0318" },
    { fileName: "hammer-curl.gif", id: "0313" },
    { fileName: "concentration-curl.gif", id: "0297" },
    { fileName: "preacher-curl.gif", id: "0446" },
    { fileName: "cable-curl.gif", id: "0165" },
    { fileName: "reverse-curl.gif", id: "0114" },
    { fileName: "zottman-curl.gif", id: "0430" },
  ],

  triceps: [
    { fileName: "triceps-pushdown.gif", id: "0201" },
    { fileName: "rope-pushdown.gif", id: "1724" },
    { fileName: "overhead-cable-extension.gif", id: "0195" },
    { fileName: "lying-triceps-extension.gif", id: "0061" },
    { fileName: "skull-crusher.gif", id: "1748" },
    { fileName: "close-grip-bench-press.gif", id: "0030" },
    { fileName: "bench-dip.gif", id: "1399" },
    { fileName: "triceps-dip.gif", id: "0814" },
    { fileName: "dumbbell-kickback.gif", id: "0333" },
    { fileName: "one-arm-triceps-extension.gif", id: "0348" },
  ],

  legs: [
    { fileName: "barbell-squat.gif", id: "0043" },
    { fileName: "front-squat.gif", id: "0024" },
    { fileName: "leg-press.gif", id: "0739" },
    { fileName: "leg-extension.gif", id: "0585" },
    { fileName: "lying-leg-curl.gif", id: "0586" },
    { fileName: "romanian-deadlift.gif", id: "0085" },
    { fileName: "stiff-leg-deadlift.gif", id: "0116" },
    { fileName: "walking-lunge.gif", id: "1460" },
    { fileName: "bulgarian-split-squat.gif", id: "0119" },
    { fileName: "hip-thrust.gif", id: "1060" },
    { fileName: "standing-calf-raise.gif", id: "1372" },
    { fileName: "seated-calf-raise.gif", id: "0594" },
  ],

  abs: [
    { fileName: "crunch.gif", id: "0274" },
    { fileName: "sit-up.gif", id: "0735" },
    { fileName: "leg-raise.gif", id: "0582" },
    { fileName: "hanging-leg-raise.gif", id: "0472" },
    { fileName: "russian-twist.gif", id: "0687" },
    { fileName: "plank.gif", id: "0463" },
    { fileName: "side-plank.gif", id: "0715" },
    { fileName: "mountain-climber.gif", id: "0630" },
    { fileName: "bicycle-crunch.gif", id: "0003" },
    { fileName: "cable-crunch.gif", id: "0171" },
  ],
};

function getSelectedGroups() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("all")) {
    return Object.keys(exerciseGroups);
  }

  return args;
}

async function baixarGif(groupName, exercise) {
  const outputDir = path.join(BASE_OUTPUT_DIR, groupName);
  const filePath = path.join(outputDir, exercise.fileName);

  const url = `${API_URL}/image?exerciseId=${exercise.id}&resolution=360`;

  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Baixando ${groupName}/${exercise.fileName}...`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    const erroTexto = await response.text().catch(() => "");

    throw new Error(
      `Erro ${response.status} ${response.statusText} ao baixar ${exercise.fileName}\n${erroTexto}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  console.log(`Salvo: ${filePath}`);
}

async function main() {
  if (!API_KEY) {
    throw new Error("Sua variável EXERCISEDB_API_KEY não foi encontrada na .env");
  }

  const selectedGroups = getSelectedGroups();

  for (const groupName of selectedGroups) {
    const group = exerciseGroups[groupName];

    if (!group) {
      console.warn(`Grupo não encontrado: ${groupName}`);
      continue;
    }

    console.log(`\n=== Baixando grupo: ${groupName} ===`);

    for (const exercise of group) {
      try {
        await baixarGif(groupName, exercise);
      } catch (error) {
        console.error(`Falhou: ${groupName}/${exercise.fileName}`);
        console.error(error.message);
      }

      // Pequena pausa para evitar muitas requisições seguidas
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  console.log("\nProcesso finalizado.");
}

main();