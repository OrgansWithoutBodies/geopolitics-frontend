export async function sleep(lenMS: number) {
  await new Promise((r) => setTimeout(r, lenMS));
  console.log(`Waited ${lenMS}ms to be friendly`);
}
