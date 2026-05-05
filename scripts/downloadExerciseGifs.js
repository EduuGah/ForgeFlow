// scripts/downloadExerciseGifs.js

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.EXERCISEDB_API_KEY;
const API_URL = process.env.EXERCISEDB_API_URL || "https://exercisedb.p.rapidapi.com";

const BASE_OUTPUT_DIR = path.resolve("public/exercise-media");

const VALID_RESOLUTIONS = ["180", "360", "720", "1080"];

const exerciseGroups = {
  chest: [
    { fileName: "bench-press-barbell.gif", id: "0025" },
    { fileName: "incline-bench-press-barbell.gif", id: "0047" },
    { fileName: "decline-bench-press-barbell.gif", id: "0033" },
    { fileName: "bench-press-dumbbell.gif", id: "0289" },
    { fileName: "incline-dumbbell-press.gif", id: "0314" },
    { fileName: "decline-dumbbell-press.gif", id: "0301" },
    { fileName: "push-up.gif", id: "0662" },
    { fileName: "incline-push-up.gif", id: "0493" },
    { fileName: "decline-push-up.gif", id: "0279" },
    { fileName: "dumbbell-fly.gif", id: "0308" },
    { fileName: "incline-dumbbell-fly.gif", id: "0319" },
    { fileName: "cable-crossover.gif", id: "1269" },
    { fileName: "low-cable-fly.gif", id: "0179" },
    { fileName: "chest-fly-machine.gif", id: "0227" },
    { fileName: "dip-chest.gif", id: "0251" },

    // extras
    { fileName: "wide-push-up.gif", id: "1311" },
    { fileName: "diamond-push-up.gif", id: "0283" },
    { fileName: "weighted-chest-dip.gif", id: "1755" },
    { fileName: "cable-middle-fly.gif", id: "0178" },
    { fileName: "lever-chest-press.gif", id: "0577" },
    { fileName: "lever-pec-deck-fly.gif", id: "0596" },
  ],

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

    // extras
    { fileName: "wide-grip-pull-up.gif", id: "1429" },
    { fileName: "assisted-pull-up.gif", id: "0017" },
    { fileName: "reverse-grip-lat-pulldown.gif", id: "0200" },
    { fileName: "one-arm-cable-row.gif", id: "0230" },
    { fileName: "machine-row.gif", id: "0571" },
    { fileName: "inverted-row.gif", id: "0499" },
    { fileName: "barbell-shrug.gif", id: "0095" },
    { fileName: "dumbbell-shrug.gif", id: "0406" },
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

    // extras
    { fileName: "seated-barbell-shoulder-press.gif", id: "0067" },
    { fileName: "seated-dumbbell-shoulder-press.gif", id: "0405" },
    { fileName: "machine-shoulder-press.gif", id: "0586" },
    { fileName: "cable-front-raise.gif", id: "0162" },
    { fileName: "plate-front-raise.gif", id: "0834" },
    { fileName: "reverse-pec-deck-fly.gif", id: "0602" },
    { fileName: "barbell-front-raise.gif", id: "0041" },
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

    // extras
    { fileName: "spider-curl.gif", id: "1621" },
    { fileName: "drag-curl.gif", id: "0038" },
    { fileName: "cross-body-hammer-curl.gif", id: "0298" },
    { fileName: "cable-hammer-curl.gif", id: "1638" },
    { fileName: "high-cable-curl.gif", id: "0167" },
    { fileName: "machine-preacher-curl.gif", id: "0572" },
    { fileName: "single-arm-cable-curl.gif", id: "1639" },
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

    // extras
    { fileName: "cable-one-arm-triceps-extension.gif", id: "1723" },
    { fileName: "dumbbell-overhead-triceps-extension.gif", id: "0335" },
    { fileName: "ez-bar-lying-triceps-extension.gif", id: "1748" },
    { fileName: "reverse-grip-triceps-pushdown.gif", id: "0200" },
    { fileName: "bodyweight-triceps-extension.gif", id: "1771" },
    { fileName: "machine-triceps-extension.gif", id: "0573" },
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

    // extras
    { fileName: "goblet-squat.gif", id: "0398" },
    { fileName: "hack-squat.gif", id: "0462" },
    { fileName: "sumo-deadlift.gif", id: "0117" },
    { fileName: "good-morning.gif", id: "0044" },
    { fileName: "glute-bridge.gif", id: "1409" },
    { fileName: "cable-pull-through.gif", id: "0197" },
    { fileName: "seated-leg-curl.gif", id: "0599" },
    { fileName: "standing-leg-curl.gif", id: "0776" },
    { fileName: "smith-machine-squat.gif", id: "0768" },
    { fileName: "calf-press-on-leg-press.gif", id: "0738" },
  ],

  // Vai salvar em /public/exercise-media/core
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

    // extras
    { fileName: "reverse-crunch.gif", id: "0872" },
    { fileName: "decline-crunch.gif", id: "0275" },
    { fileName: "ab-wheel-rollout.gif", id: "0001" },
    { fileName: "kneeling-cable-crunch.gif", id: "0171" },
    { fileName: "hanging-knee-raise.gif", id: "0473" },
    { fileName: "flutter-kicks.gif", id: "0456" },
    { fileName: "dead-bug.gif", id: "0276" },
    { fileName: "v-up.gif", id: "0826" },
    { fileName: "toe-touch.gif", id: "0884" },
    { fileName: "wood-chop.gif", id: "2142" },
  ],
};

function parseArgs() {
  const args = process.argv.slice(2);

  const options = {
    groups: [],
    resolution: "720",
    overwrite: false,
    delay: 500,
  };

  for (const arg of args) {
    if (arg.startsWith("--resolution=")) {
      options.resolution = arg.split("=")[1];
      continue;
    }

    if (arg.startsWith("--delay=")) {
      options.delay = Number(arg.split("=")[1]);
      continue;
    }

    if (arg === "--overwrite") {
      options.overwrite = true;
      continue;
    }

    options.groups.push(arg);
  }

  if (options.groups.length === 0 || options.groups.includes("all")) {
    options.groups = Object.keys(exerciseGroups);
  }

  if (!VALID_RESOLUTIONS.includes(options.resolution)) {
    console.warn(
      `Resolução inválida: ${options.resolution}. Usando 720 como padrão.`
    );

    options.resolution = "720";
  }

  if (Number.isNaN(options.delay) || options.delay < 0) {
    options.delay = 500;
  }

  return options;
}

function getOutputGroupName(groupName) {
  if (groupName === "abs") return "core";

  return groupName;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function baixarGif(groupName, exercise, options) {
  const outputGroupName = getOutputGroupName(groupName);
  const outputDir = path.join(BASE_OUTPUT_DIR, outputGroupName);
  const filePath = path.join(outputDir, exercise.fileName);

  const url = `${API_URL}/image?exerciseId=${exercise.id}&resolution=${options.resolution}`;

  await fs.mkdir(outputDir, { recursive: true });

  if (!options.overwrite && (await fileExists(filePath))) {
    console.log(`Pulando ${outputGroupName}/${exercise.fileName} — já existe.`);
    return {
      status: "skipped",
      filePath,
    };
  }

  console.log(
    `Baixando ${outputGroupName}/${exercise.fileName} em ${options.resolution}p...`
  );

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

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("image/gif")) {
    console.warn(
      `Aviso: ${exercise.fileName} não veio como GIF. Content-Type: ${contentType}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  console.log(`Salvo: ${filePath} (${formatFileSize(buffer.length)})`);

  return {
    status: "downloaded",
    filePath,
  };
}

function formatFileSize(bytes) {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 2);

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

async function main() {
  if (!API_KEY) {
    throw new Error("Sua variável EXERCISEDB_API_KEY não foi encontrada na .env");
  }

  const options = parseArgs();

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log("\nForgeFlow GIF Downloader");
  console.log(`Resolução: ${options.resolution}`);
  console.log(`Sobrescrever existentes: ${options.overwrite ? "Sim" : "Não"}`);
  console.log(`Grupos: ${options.groups.join(", ")}`);

  for (const groupName of options.groups) {
    const group = exerciseGroups[groupName];

    if (!group) {
      console.warn(`Grupo não encontrado: ${groupName}`);
      continue;
    }

    console.log(`\n=== Baixando grupo: ${groupName} ===`);

    for (const exercise of group) {
      try {
        const result = await baixarGif(groupName, exercise, options);

        if (result.status === "downloaded") downloaded += 1;
        if (result.status === "skipped") skipped += 1;
      } catch (error) {
        failed += 1;

        console.error(`Falhou: ${groupName}/${exercise.fileName}`);
        console.error(error.message);
      }

      await sleep(options.delay);
    }
  }

  console.log("\nProcesso finalizado.");
  console.log(`Baixados: ${downloaded}`);
  console.log(`Pulados: ${skipped}`);
  console.log(`Falharam: ${failed}`);
}

main();