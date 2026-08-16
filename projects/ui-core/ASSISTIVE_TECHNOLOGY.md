# Manual assistive-technology validation

Automated axe-core and keyboard tests are necessary but cannot prove that a screen reader announces each component correctly. Neural UI therefore keeps manual results separate and leaves them `UNVERIFIED` until a named tester records reproducible evidence for the exact release candidate.

## Free validation matrix

| Target    | Platform   | Browser           | Cost                     | Required status        |
| --------- | ---------- | ----------------- | ------------------------ | ---------------------- |
| NVDA      | Windows    | Firefox or Chrome | Free/open source         | Manual result required |
| Narrator  | Windows    | Edge              | Included with Windows    | Manual result required |
| VoiceOver | macOS      | Safari            | Included with macOS      | Manual result required |
| VoiceOver | iOS/iPadOS | Safari            | Included with iOS/iPadOS | Manual result required |
| TalkBack  | Android    | Chrome            | Included/free            | Manual result required |
| JAWS      | Windows    | —                 | Paid                     | `NOT_VALIDATED_PAID`   |

JAWS is intentionally outside the program because the quality work must have zero monetary cost. Its absence is disclosed; it is never converted into `PASS` or treated as equivalent coverage.

## Per-entry-point procedure

Use the built showcase for the candidate commit. For every rendered entry point and every required target:

1. Reach every documented state using only the keyboard or the platform's standard touch exploration gestures.
2. Verify the accessible name, role, value/state, help/error relationship and disabled/busy/expanded/selected announcements.
3. Verify reading and focus order, overlay entry, focus containment when modal, Escape/dismiss behavior and focus restoration.
4. Repeat any direction-sensitive interaction after switching the live showcase to RTL.
5. Record a `PASS` only when the complete path succeeds. Record a reproducible `FAIL` for product defects and `BLOCKED` only for an unavailable platform or test-environment failure.
6. Include tester, date, core commit, OS, browser and assistive-technology versions. Notes must identify the exercised states and any known limitation.

Results belong in `quality/manual-at-evidence.json`. The canonical quality matrix consumes those records; an empty result set intentionally leaves the five manual dimensions `UNVERIFIED`.

## Completion rule

Technical 10/10 requires all applicable manual cells to pass. Codex and automated tooling may prepare the test surface and verify record integrity, but cannot claim that a human heard or navigated an announcement it did not actually test.
