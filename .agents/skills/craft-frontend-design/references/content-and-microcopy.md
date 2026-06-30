# Content And Microcopy Playbook

Use this when writing UI copy, replacing placeholders, or removing AI-template language.

## Copy Principles

- Name the user's real task.
- Name real objects in the domain.
- Tie benefits to visible UI or state.
- Prefer verbs that match the action.
- Keep status and error copy close to the affected control.
- Use concise copy for mobile and mini-program flows.

## Replace Generic Claims

Avoid:

- AI-powered;
- next-generation;
- seamless experience;
- transform your workflow;
- unlock potential;
- all-in-one platform;
- beautiful modern responsive;
- supercharge productivity;
- revolutionary solution.

Replace with:

- who is acting;
- what object changes;
- what state/result is visible;
- what the user can do next.

Example:

```text
Weak: AI-powered insights for seamless operations.
Better: Flag delayed berth handoffs before the next tug assignment.
```

## State Copy

Provide:

- loading: what is loading and whether layout is preserved;
- empty: why it is empty and what to do next;
- error: what failed, what is preserved, how to retry;
- disabled: why action is unavailable;
- pending: what is being saved/submitted;
- success: what changed and where to continue.

## English UI

- Use direct verbs for actions: Assign, Retry, Compare, Export, Book.
- Avoid abstract nouns as button labels.
- Keep table and dashboard labels compact.
- Use sentence case unless the existing system differs.

## Chinese-Facing UI

- Prefer natural, concise Chinese over translated English structure.
- Keep mobile labels short.
- Avoid slogans in task surfaces.
- Put error recovery in plain language.
- Verify long labels on narrow screens.

Examples:

```text
Weak: 智能赋能您的学习空间体验
Better: 选择时段并预约自习室

Weak: 操作失败
Better: 预约未提交，请检查网络后重试
```

## Placeholder Elimination

Before final delivery, search for:

- lorem;
- placeholder;
- sample;
- your company;
- feature one/two/three;
- untitled;
- coming soon;
- fake metric names not tied to the task.

Replace with domain-specific content or mark intentionally mocked data in a development-only fixture.
