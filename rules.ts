
export const codingRules = [
    {
    name: 'Code Quality',
    description: `Code should follow best practices and be well-structured, this includes :
    - Not put any comment in the code that are not necessary, like console logs for debugging
    - Not use useEffect if not necessary (avoid re-rendering & performance issues)

    `,
    required: true
    },
    {
    name: 'Security',
    description: 'No security vulnerabilities or sensitive data exposure',
    required: true
    },
    {
    name: 'Error Handling',
    description: 'Proper error handling should be implemented',
    required: true
    },
    {
    name: 'Testing',
    description: 'New features should include appropriate tests',
    required: false
    },
    ];
  