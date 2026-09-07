# 558. The Clash Report Nobody Reads: Grouping, Ownership, and Status

## What It Is
A clash query returns pairs. A project needs decisions. The distance between those two things is the reason so many coordination processes produce a four-thousand-row spreadsheet that everybody agrees is important and nobody opens. **A list of pairs is not a finding**, and converting one into the other is three separate operations, none of them geometric.

The first is **grouping**, and the useful principle is that a group should correspond to a decision rather than to a geometric event. One duct routed through a line of twelve beams produces twelve rows and represents **one** routing decision; splitting it into twelve issues creates twelve conversations about the same choice. Grouping by discipline pair tells you which two teams need to talk; grouping by location tells you which part of the building is in trouble; grouping by cause — one element against many — is what actually maps onto the work. Most reports need more than one of these, and a report that offers only the raw pairs has pushed the hardest step onto its reader.

The second is **ownership**. Every group needs exactly one discipline that can act on it, and the assignment is a judgement, not a lookup: a duct through a beam might be resolved by rerouting the duct, by adding a penetration to the beam, or by moving the beam, and those are three different owners. Groups with no owner sit forever; groups with two owners sit slightly less forever. This is the step that turns a report into work.

The third is **status over time**, and it is where identity comes back. A coordination process re-runs the query weekly, and the only useful question about the new results is which of them are new. Answering it requires matching this week's pairs to last week's, and the match key is the **pair of element identities** — not the row number, not the description, not the position, all of which move. When the identities are stable, a resolved issue stays resolved and a returning one is visible; when they are not (Lesson 555's orphaning failure), every re-run reports everything as new and the process quietly reverts to re-reading four thousand rows.

Once grouped, owned and tracked, the natural container for a group is a BCF topic: a title, an assignee, a status, a comment thread, and a viewpoint holding exactly the element identities the group was built from. **The report is the transport, not the artefact** — what survives is the set of issues.

```quiz
- q: "One duct crosses twelve beams. How many issues should that be?"
  anchor: "a group should correspond to a decision rather than to a geometric event"
  options:
    - text: "Twelve — each intersection is a distinct physical problem"
      correct: false
      why: "It creates twelve conversations about one routing choice."
    - text: "One — it represents a single routing decision, whatever the geometry produced"
      correct: true
      why: "Groups should map onto the work, and the work here is one decision."
    - text: "Two — one for the duct's discipline and one for the structure's"
      correct: false
      why: "Ownership is a separate step; splitting by discipline duplicates the same decision."

- q: "What makes an unowned clash group a problem?"
  anchor: "Groups with no owner sit forever"
  options:
    - text: "It cannot be exported to BCF without an assignee"
      correct: false
      why: "The format permits an unassigned topic. The problem is organisational, not technical."
    - text: "Nothing moves it — the assignment is what turns a report into work"
      correct: true
      why: "And two owners is only slightly better than none."
    - text: "It will be re-detected on the next run and duplicated"
      correct: false
      why: "Duplication is a matching problem, and it is solved by identity rather than by ownership."

- q: "A weekly clash re-run reports every issue as new. What has gone wrong?"
  anchor: "the match key is the **pair of element identities**"
  options:
    - text: "The tolerance changed between runs"
      correct: false
      why: "That would change which pairs appear, not make all of them unmatchable."
    - text: "Element identities are not stable across exports, so this week's pairs cannot be matched to last week's"
      correct: true
      why: "It is Lesson 555's orphaning failure arriving through a different door."
    - text: "The report was sorted differently, so the row numbers moved"
      correct: false
      why: "Row numbers were never a usable key; identity is."
```

## Key Concepts
- **A list of pairs is not a finding** — three non-geometric steps stand between the query and a decision
- **Group by decision**, not by geometric event: one duct through twelve beams is one routing choice
- **Several groupings are useful** — discipline pair (who talks), location (where), cause (what to change)
- **Ownership is a judgement**: the same clash may be resolved by three different disciplines
- **No owner means no movement**; two owners is barely better
- **Status over time needs a match key**, and the only stable one is the pair of element identities
- **Unstable identities make every re-run report everything as new** (Lesson 555)
- **The report is transport; the issues are the artefact** — a group becomes a BCF topic

## Example Code
The two groupings a report usually needs, and why offering only one is a choice with consequences:

```tradeoff
question: "Group a clash report by discipline pair, or by location cluster?"
sides:
  - name: "By discipline pair"
    wins_when:
      - signal: "the immediate need is to schedule conversations — each group maps to exactly two teams who have to agree on something"
      - signal: "the disciplines work in separate models and separate tools, so the resolution always happens inside one of two authoring environments"
      - signal: "ownership assignment is the bottleneck, since a discipline pair narrows the owner to one of two candidates immediately"
      - signal: "the project reports progress by trade package, so a burn-down per discipline pair is the number people already track"
  - name: "By location cluster"
    wins_when:
      - signal: "the interferences concentrate in a few areas — a plant room, a riser, a ceiling void — and one visit or one design change resolves many of them"
      - signal: "the work is sequenced by zone or by level, so a group that crosses the whole building cannot be scheduled as one item"
      - signal: "several disciplines are involved in the same congested space, and a discipline-pair grouping would split one physical problem into six issues"
      - signal: "site coordination is driving the process, where the question is 'what is wrong in this room' rather than 'what do these two teams owe each other'"
```

Neither grouping is a property of the geometry, which is the point: the query produced pairs, and every structure imposed on them afterwards is a statement about how the project intends to work.

## When to Use
- Immediately after any clash run large enough that nobody will read the raw output — which is most of them
- When a coordination process is producing reports but not resolutions, where ownership is usually the missing step
- When agreeing a coordination cadence, since the re-run matching requirement decides whether history is worth keeping
- When choosing a grouping, which is a decision about how the project works rather than about the model
- When issues have to leave the coordination tool, where a group becomes a topic with its own viewpoint (Lesson 555)

## Common Mistakes
- **Shipping the raw pair list** — it moves the hardest step onto the reader, who is the person with the least context
- **One issue per intersection** — twelve conversations about one routing decision, and eleven of them are duplicates
- **Leaving groups unassigned** — nothing without an owner ever changes state
- **Matching re-runs by row number or description** — both move between runs; only element identity survives
- **Reporting a count as progress** — a falling clash count can mean resolution, a raised tolerance, or a model that failed to load
- **Treating the spreadsheet as the deliverable** — the issues are the artefact, and they need to live where the model is authored

## Further Reading
- [buildingSMART BCF-XML specification and schemas](https://github.com/buildingSMART/BCF-XML) — the topic fields a grouped clash becomes: status, assignee, labels, comments, viewpoint
- [Lesson 557](/courses/model-coordination-exchange/clash-detection-is-a-query) — where the pairs come from, and why the tolerance has to travel with them
- [Lesson 555](/courses/model-coordination-exchange/bcf-an-issue-as-a-portable-object) — the identity anchor that makes weekly re-run matching possible
- [Lesson 242](/courses/client-delivery-pm-handover/risk-issue-and-dependency-logs) — the same ownership-and-status argument for a delivery log, where the items are not geometric at all

```recall
- q: "Name the three steps between a clash query's output and a project decision."
  must:
    - "grouping, where a group should correspond to a decision rather than a geometric event"
    - "ownership, assigning exactly one discipline that can act on each group"
    - "status over time, which needs a stable match key to tell new issues from returning ones"

- q: "Why is the pair of element identities the only usable match key across re-runs?"
  must:
    - "row numbers, descriptions and positions all change between runs"
    - "identity survives a re-export when the exporter persists GlobalIds"
    - "if it does not, every re-run reports everything as new and the history is worthless"

- q: "Why do several groupings exist rather than one correct one?"
  must:
    - "grouping is a statement about how the project intends to work, not a property of the geometry"
    - "discipline pair maps to who must talk; location maps to where the work happens; cause maps to what changes"
    - "a report offering only raw pairs has pushed the hardest step onto its reader"
```
