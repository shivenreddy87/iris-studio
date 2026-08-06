# Lifecycle Diagrams

## Campaign request

```text
draft ──submit──► submitted ──start review──► under_review
                                   ├── approve ─────► approved ──► contest created
                                   ├── reject ──────► rejected
                                   └── request changes ► changes_requested
changes_requested ──resubmit──► submitted
draft | submitted ──cancel──► cancelled
```

## Contest

```text
draft ─► published ─► applications_open ─► applications_closed
      ─► participant_selection ─► live ─► completed ─► archived
```

## Contest application

```text
submitted ──► shortlisted ──► selected  (creates contest_participant)
   │                └──────► rejected
   └── withdrawn (influencer, while applications are open)
```

## Content submission

```text
pending ─► submitted ─► verified
                    └─► flagged ─► (resubmission allowed while contest is live)
```

## Winner selection

```text
verified submissions ─► scored (performance + manual) ─► ranked
                     ─► winners finalised ─► contest completed ─► payouts created
```

## Payout

```text
pending ─► details_requested ─► waiting_for_details ─► processing ─► paid
                                                            ├─► failed
                                                            └─► cancelled
```

`paid` and `cancelled` are terminal; `isPayoutImmutable` blocks further edits.
