# AGENTS.md

thinklab publishes long-form technical writing that rewards rereading.

> **Write what a careful reader will want to reread many times —
> grounded in truth, deep enough to change how they see it, rendered
> so every word, figure, and formula earns its place.**

If any rule below conflicts with this principle, the principle wins.

---

## Scope

All article work lives under `articles/<slug>/`: the manuscript is
`articles/<slug>/index.html` and its figures sit alongside it. Only
touch `articles.json` and `assets/theme.css` outside that directory,
and only when a real primitive is missing.

---

## Research

Read the paper end-to-end, the authors' blog, and the prior work it
builds on (GLM-5's DSA needs DeepSeek-V3.2's DSA; MuonClip needs
Muon). Abstracts are marketing; paper + code + artifacts are ground.

Sources, low → high trust:

1. Blog / project page / model card — framing.
2. Paper abstract + intro — the claim.
3. Paper §method / §training / §eval / appendix — the mechanism.
4. Official code — name the file and function that implement it.
5. Released artifacts — `config.json`, `tokenizer.json`, checkpoints.
   Pin 40-char commit SHAs.

Discipline:

- **Read the code, not the README.** The code is what shipped;
  the README is what the authors wanted to ship.
- Cross-check paper equations against the runnable loss; name drift.
- **Reconstruct, don't just recompute.** Rebuild every sub-total,
  average, or headline number from its underlying cells. Mismatch
  means your cell-level reading is wrong — fix the reading.
- **Tag every load-bearing claim — numbers and prior art both.**
  Numbers: paper §N.N, code `<path>:L<line>@<SHA>`, computed from
  $(a,b)$, or "could not verify". Prior art: every motivational
  antecedent cited in §1 / §Method gets one sentence of its
  specific contribution in your own words. A reference list is
  not reading.
- **Analogies are claims.** "Similar to X", "in the spirit of Y"
  — if load-bearing, check X or Y's actual definition first.
- If a load-bearing claim can't be verified, **stop and ask**.

---

## Quality bar

Four dimensions. Miss any and the article fails.

### True

- Every concrete claim (number, quote, attribution, benchmark row)
  has a source. If unknown, write "I could not verify this".
- Benchmarks carry split, version, prompt; dates carry the year.
- Pin SHAs on `github.com/.../blob/` and `huggingface.co/.../(blob|resolve)/` links.
- When citing a `config.json` field, put the value in prose so the
  sentence survives link rot.

### Deep

- Name the real mechanism — loss term, routing bias, config field,
  code diff — not the marketing summary.
- Show the argument end-to-end; no hand-waved steps.
- Each section teaches one sharp idea.
- **Thesis has paper-section anchors.** Name (i) the specific prior
  observation or tension the paper resolves, (ii) the mechanism
  that resolves it — each tied to a § or Tab. / Fig. / Eq. anchor.
  A paraphrase of the abstract is not a thesis.
- **Anti-template.** If your draft's shape could be lifted from
  last week's article with terms swapped, the shape did the work.
  Primitives are for rendering, not argument structure — derive
  shape from *this* paper.
- Test: **could this section be written without opening sources?**
  If yes, cut or rewrite.

### Beautifully laid out

Prose carries argument, figures structure, formulas operations,
tables shared-axis comparison, code the teaching function. Use them
together when one isn't enough. Nothing is decorative.

**Figures — accurate, expressive, clean.** Match primitive to job:
`.pipe .step` or inline SVG for flow; `.fig-grid.c2` of `.fig-card`s
(or `.c3-delta` + `.fig-diff-arrows`) for contrast; `.fig-stat-row`
for headline numbers; `<table>` in `.table-wrap` for matrices.
Wrap in `.fig-wrap` + `.fig-bar` + `.fig-cap` that *orients* (what
to look at, why) rather than restates prose. One accent per
semantic role article-wide (green = ours, magenta = prior, amber =
drift). Figure reads standalone. **No overflow, ever** — fit at
narrow and wide widths via `viewBox`+`preserveAspectRatio` on SVGs,
`.table-wrap` on tables, wrapping flex/grid rows. If it won't fit,
redesign; don't ship.

**Math — exact operations.** `$...$` inline, `$$...$$` display.
Define each symbol on first use; tie it to a code identifier or
paper equation. KaTeX rejects `align / equation / gather / alignat
/ multline` — use one expression or stacked blocks.

**Code — the smallest slice that teaches the contribution.** Every
`<pre><code>` carries `class="language-*"`; quote with
`<path>:L<line>@<SHA>` pinned; say in prose what to notice.

**Tooling.** Use `assets/theme.css` primitives (`.card`, `.callout`,
`.hero-*`, `.fig-*`, `.table-wrap`, `.grid.c2|c3|c4`, `.formula`);
inline SVG with shared `<defs>` (`P-grid`, `A-*`, `G-*`, `F-glow`);
Mermaid only for standard topologies that read clean on dark.

### Worth re-reading

- Dense: every sentence earns its place.
- Signed: opinions have an authorial voice.
- Layered: first pass gives thesis/shape; later passes reveal
  derivations, drift callouts, the code behind the prose.
- Self-contained: no worklog, meta-notes, or CJK glyphs in shipped
  files. English only.

---

## Before you ship

**Tie-breakers**, in order:

1. Truth over smoothness.
2. Depth over coverage.
3. Insight over summary.
4. Reader clarity over writer cleverness.
5. Reusable structure over one-off flourish.

**Fail checks** — run after each draft, not only at ship. Fix any "yes":

1. Unsourced concrete claim?
2. Arithmetic copied instead of recomputed / reconstructed?
3. Section writable without opening sources?
4. Decorative figure, table, or formula?
5. Sentence that breaks if the link dies?
6. Mechanism claim traced only to abstract, blog, or project page?
7. Load-bearing number without a provenance tag?
8. Figure that overflows or clips at narrow/wide widths?
9. Provenance tag I never verified by reconstruction or source-quote?
10. Prior-art I can't summarize in one sentence without re-opening?
11. Section heading that would fit another paper unchanged?

**Publishing steps:**

1. Open in a browser at narrow (~360 px) and wide (~1440 px); fix
   any overflow before anything else.
2. Write the card **thesis** (one sentence — the claim; answers
   "why read") and **summary** (2–4 factual sentences — what's in
   it, at what depth). A pair, not duplicates.
3. Append one entry to `articles.json`:
   ```json
   {"slug":"","path":"articles/<slug>/","date":"YYYY-MM-DD",
    "title":"","thesis":"","summary":""}
   ```

---

Understand, think, write — then reread and revise until *you* would
want to read it again. Your bar is set by the paper's claims and by
what a careful reader would demand to verify them. Not by the shape
of past thinklab articles. Not by a cleared todo list.

If someone asks whether you did the work, answer by listing the
sources you opened and the specific facts you extracted. If you
can't list them, you didn't.
