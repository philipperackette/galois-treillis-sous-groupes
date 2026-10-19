/* global DATA */
import { test, expect } from "@playwright/test";
import { adresse, surveiller } from "./outils.js";

// Groupes réalisés par des permutations (tableaux d'images), loi : (p∘q)(x) = p(q(x)).
const rond = (p, q) => q.map((x) => p[x]);
function engendre(gens) {
  const n = gens[0].length, id = [...Array(n).keys()];
  const vus = new Map([[id.join(), id]]), file = [id];
  while (file.length) {
    const a = file.pop();
    for (const g of gens) {
      const b = rond(g, a), k = b.join();
      if (!vus.has(k)) { vus.set(k, b); file.push(b); }
    }
  }
  return [...vus.values()];
}
const cycle = (n) => [...Array(n).keys()].map((i) => (i + 1) % n);
const dihedral = (n) => [cycle(n), [...Array(n).keys()].map((i) => (n - i) % n)];
// ℚ₈ comme permutations de ses 8 éléments ±1, ±i, ±j, ±k (représentation régulière).
const quaternions = (() => {
  const T = { "1": { "1": "1", i: "i", j: "j", k: "k" }, i: { "1": "i", i: "-1", j: "k", k: "-j" },
    j: { "1": "j", i: "-k", j: "-1", k: "i" }, k: { "1": "k", i: "j", j: "-i", k: "-1" } };
  const el = ["1", "i", "j", "k", "-1", "-i", "-j", "-k"];
  const prod = (a, b) => {
    const sa = a.startsWith("-"), sb = b.startsWith("-"), r = T[a.replace("-", "")][b.replace("-", "")];
    const neg = (sa !== sb) !== r.startsWith("-");
    return (neg ? "-" : "") + r.replace("-", "");
  };
  return ["i", "j"].map((g) => el.map((x) => el.indexOf(prod(g, x))));
})();
const GROUPES = {
  V4: [[1, 0, 3, 2], [2, 3, 0, 1]], Z6: [cycle(6)], S3: [[1, 0, 2], [1, 2, 0]], Z8: [cycle(8)],
  D4: dihedral(4), Q8: quaternions, Z12: [cycle(12)], A4: [[1, 2, 0, 3], [1, 0, 3, 2]],
  D6: dihedral(6), S4: [[1, 0, 2, 3], [1, 2, 3, 0]],
};

// Tous les sous-groupes (engendrés par au plus deux éléments : suffisant ici),
// lesquels sont distingués, et les arêtes du diagramme de Hasse.
function treillis(gens) {
  const G = engendre(gens), cle = (H) => H.map((p) => p.join()).sort().join("|");
  const sg = new Map();
  for (const a of G) for (const b of G) { const H = engendre([a, b]); sg.set(cle(H), H); }
  const liste = [...sg.values()];
  const inv = (p) => p.map((_, i) => p.indexOf(i));
  const ens = liste.map((H) => new Set(H.map((p) => p.join())));
  const conjugue = (g, h) => rond(rond(g, h), inv(g)).join();
  const distingue = liste.map((H, i) => G.every((g) => H.every((h) => ens[i].has(conjugue(g, h)))));
  const inclus = (i, j) => liste[i].length < liste[j].length && liste[i].every((p) => ens[j].has(p.join()));
  let aretes = 0;
  liste.forEach((_, i) => liste.forEach((_, j) => {
    if (inclus(i, j) && !liste.some((_, k) => inclus(i, k) && inclus(k, j))) aretes++;
  }));
  return { ordre: G.length, ordres: liste.map((H) => H.length), distingues: liste.filter((_, i) => distingue[i]).map((H) => H.length), aretes };
}
const trie = (t) => [...t].sort((a, b) => a - b);

test.beforeEach(async ({ page }) => {
  await page.goto(adresse("index.html"));
});

test("treillis affichés comparés à l'énumération de tous les sous-groupes", async ({ page }) => {
  const data = await page.evaluate(() => Object.fromEntries(Object.entries(DATA).map(([k, d]) => [k, {
    ordre: d.order, ordres: d.nodes.map((n) => n.order), distingues: d.nodes.filter((n) => n.normal).map((n) => n.order),
    aretes: d.edges.length, partiel: !!d.extra,
    coherent: d.nodes.every((n) => d.order % n.order === 0) &&
      d.edges.every(([a, b]) => { const A = d.nodes.find((n) => n.id === a), B = d.nodes.find((n) => n.id === b); return A.order > B.order && A.order % B.order === 0; }),
  }])));
  expect(Object.keys(data).sort()).toEqual(Object.keys(GROUPES).sort());
  for (const [cle, gens] of Object.entries(GROUPES)) {
    const reel = treillis(gens), d = data[cle];
    expect(d.coherent, `${cle} : ordres et inclusions`).toBe(true);
    expect(d.ordre, `${cle} : ordre du groupe`).toBe(reel.ordre);
    if (cle === "D6") {
      // Vue limitée aux sous-groupes distingués.
      expect(trie(d.ordres), "D6 : sous-groupes distingués").toEqual(trie(reel.distingues));
    } else if (d.partiel && d.ordres.length !== reel.ordres.length) {
      // Vue simplifiée : les sous-groupes distingués affichés sont exactement ceux du groupe.
      expect(trie(d.distingues), `${cle} : distingués`).toEqual(trie(reel.distingues));
    } else {
      expect(trie(d.ordres), `${cle} : sous-groupes`).toEqual(trie(reel.ordres));
      expect(trie(d.distingues), `${cle} : distingués`).toEqual(trie(reel.distingues));
      expect(d.aretes, `${cle} : arêtes du diagramme de Hasse`).toBe(reel.aretes);
    }
  }
});

test("interface : détail d'un sous-groupe de D₄ et changement de groupe", async ({ page }) => {
  const suivi = surveiller(page);
  await page.selectOption("#grp", "D4");
  await expect(page.locator("#lattice g[data-id]")).toHaveCount(10);
  await page.locator('#lattice g[data-id="r2"]').dispatchEvent("click");
  await expect(page.locator("#detail")).toContainText("distingué ✓");
  await expect(page.locator("#detail")).toContainText("Quotient D₄/H : ≅ V₄");
  await page.locator('#lattice g[data-id="s"]').dispatchEvent("click");
  await expect(page.locator("#detail")).toContainText("non distingué ✗");
  await page.selectOption("#grp", "S4");
  await expect(page.locator("#detail")).toContainText("Vue simplifiée");
  suivi.verifier();
});
