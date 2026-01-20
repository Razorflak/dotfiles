import { execSync } from "child_process";

export const isWorktreeRepo = () => {
  // Vérifier si on est dans un dépôt Git principal
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    if (
      execSync("git rev-parse --is-inside-git-dir", { stdio: "pipe" })
        .toString()
        .trim() !== "true"
    ) {
      console.error(
        "Ce script ne doit pas être exécuté dans le dossier .git. Exécutez-le à la racine du dépôt.",
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("Ce script doit être exécuté dans un dépôt Git valide.");
    process.exit(1);
  }
};
