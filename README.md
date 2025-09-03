# AI PR Reviewer

An intelligent pull request validation agent powered by OpenAI that automatically reviews your PRs and enforces coding standards.

## Features

- 🤖 **AI-Powered Reviews**: Uses GPT-4 to analyze code changes
- 🛡️ **Customizable Rules**: Define your own validation criteria
- 🚫 **Merge Protection**: Prevents merging of non-compliant PRs
- 📊 **Detailed Feedback**: Provides scores, issues, and suggestions
- ⚡ **Fast & Efficient**: Smart file filtering and analysis
- 🔒 **Secure**: Uses GitHub secrets for API keys

## Quick Setup

### 1. Add OpenAI API Key

1. Go to your repository Settings → Secrets and Variables → Actions
2. Add a new secret named `OPENAI_API_KEY` with your OpenAI API key

### 2. Enable GitHub Actions

The workflow file `.github/workflows/pr-review.yml` is already configured. Just push it to your repository!

### 3. Configure Branch Protection

1. Go to Settings → Branches
2. Add a branch protection rule for your main branch
3. Enable "Require status checks to pass before merging"
4. Select "AI Code Review" as a required status check

## Configuration

### System Rules

Edit the `SYSTEM_RULES` in `.github/workflows/pr-review.yml` or use the provided `validation-rules.json`:

```json
[
  {
    "name": "Code Quality",
    "description": "Code should follow best practices and be well-structured",
    "required": true
  },
  {
    "name": "Security", 
    "description": "No security vulnerabilities or sensitive data exposure",
    "required": true
  }
]
```

### Workflow Options

| Input | Description | Default |
|-------|-------------|---------|
| `EXCLUDE_PATTERNS` | File patterns to skip | `*.md,*.txt,*.lock` |
| `SYSTEM_RULES` | Custom validation rules | Default rules |

### Example Custom Rules

```yaml
SYSTEM_RULES: |
  [
    {
      "name": "TypeScript Best Practices",
      "description": "Use proper TypeScript types and interfaces",
      "required": true
    },
    {
      "name": "React Hooks",
      "description": "Follow React hooks best practices",
      "required": true
    },
    {
      "name": "API Security",
      "description": "Validate all API inputs and sanitize outputs",
      "required": true
    }
  ]
```

## How It Works

1. **Trigger**: Runs automatically on PR creation/updates
2. **Analysis**: Fetches PR changes and sends to OpenAI
3. **Validation**: Checks against your custom rules
4. **Feedback**: Posts detailed review comments
5. **Status**: Sets pass/fail status for branch protection

## Review Output

The AI reviewer provides:

- ✅/❌ **Approval Status**
- 📊 **Quality Score** (0-100)
- 🔴 **Critical Issues** (must fix)
- 💡 **Suggestions** (optional improvements)
- 📝 **Summary** of changes

## Cost Optimization

- Use `gpt-3.5-turbo` for lower costs
- Limit `MAX_FILES` for large PRs
- Add more exclusion patterns
- Use specific validation rules

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure `OPENAI_API_KEY` secret is set
2. **Permission Errors**: Check workflow permissions in YAML
3. **Rate Limits**: Implement retry logic or reduce frequency
4. **Large PRs**: Increase `MAX_FILES` or add exclusions

### Debugging

Check the Actions tab for detailed logs and error messages.

## Development

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Test locally (requires environment variables)
npm run dev
```

## License

MIT License - feel free to customize for your needs!
