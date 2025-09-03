# Setup Guide for AI PR Reviewer

## Step-by-Step Setup

### 1. Repository Setup

1. **Clone or fork this repository** to your GitHub account
2. **Push the code** to your target repository where you want PR validation

### 2. OpenAI API Key Configuration

1. **Get OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Go to API Keys section
   - Create a new secret key

2. **Add to GitHub Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Click "Add secret"

### 3. Branch Protection Rules

**Critical**: This step ensures PRs cannot be merged without AI approval.

1. **Go to Repository Settings**:
   - Navigate to Settings → Branches

2. **Add Branch Protection Rule**:
   - Click "Add rule"
   - Branch name pattern: `main` (or your default branch)

3. **Configure Protection Settings**:
   - ☑️ **Require a pull request before merging**
   - ☑️ **Require status checks to pass before merging**
   - ☑️ **Require branches to be up to date before merging**
   - In the status checks search box, type: **"AI Code Review"**
   - Select it from the dropdown
   - ☑️ **Restrict pushes that create files that exceed the path length limit**

4. **Optional Advanced Settings**:
   - ☑️ **Require conversation resolution before merging**
   - ☑️ **Include administrators** (applies rules to admins too)
   - ☑️ **Allow force pushes** → **Everyone** (or restrict as needed)

### 4. Test the Setup

1. **Create a test branch**:
   ```bash
   git checkout -b test-ai-reviewer
   ```

2. **Make a small change** (e.g., edit README.md)

3. **Push and create a PR**:
   ```bash
   git add .
   git commit -m "Test AI reviewer"
   git push origin test-ai-reviewer
   ```

4. **Create PR on GitHub** and watch the AI reviewer in action!

### 5. Workflow Customization

Edit `.github/workflows/pr-review.yml` to customize:

- **Model**: Change `OPENAI_MODEL` to `gpt-3.5-turbo` for lower costs
- **Rules**: Modify `SYSTEM_RULES` for your specific requirements
- **File limits**: Adjust `MAX_FILES` based on your typical PR size
- **Exclusions**: Add more patterns to `EXCLUDE_PATTERNS`

### 6. Cost Management

**Important**: Monitor your OpenAI usage to avoid unexpected bills.

- **Model Costs** (approximate):
  - GPT-4: $0.03 per 1K tokens
  - GPT-3.5-turbo: $0.002 per 1K tokens

- **Typical PR Review**: 500-2000 tokens
- **Monthly estimate**: $5-50 depending on PR frequency and model

**Cost-saving tips**:
- Use `gpt-3.5-turbo` for most reviews
- Set `MAX_FILES: 5` for large repositories
- Add build/generated files to exclusions
- Consider running only on specific branches

### 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Action fails with "API key not found" | Check `OPENAI_API_KEY` secret is set correctly |
| No status check appears | Ensure workflow has proper permissions in YAML |
| PR can be merged despite failure | Verify branch protection rule includes "AI Code Review" |
| Large PRs timeout | Increase `MAX_FILES` or add more exclusion patterns |
| Too many requests | Add rate limiting or reduce PR frequency |

### 8. Advanced Configuration

#### Custom Rules Example
```json
[
  {
    "name": "TypeScript Strict Mode",
    "description": "All TypeScript files must use strict mode and proper typing",
    "required": true
  },
  {
    "name": "Database Security",
    "description": "SQL queries must use parameterized statements",
    "required": true
  },
  {
    "name": "React Performance",
    "description": "React components should use proper optimization techniques",
    "required": false
  }
]
```

#### Multiple Environments
```yaml
# Different rules for different branches
- name: Production Rules
  if: github.base_ref == 'main'
  with:
    SYSTEM_RULES: ${{ vars.PROD_RULES }}

- name: Development Rules  
  if: github.base_ref == 'develop'
  with:
    SYSTEM_RULES: ${{ vars.DEV_RULES }}
```

## Support

- **GitHub Issues**: Report bugs or feature requests
- **Documentation**: Check README.md for detailed information
- **OpenAI Docs**: [OpenAI API Documentation](https://platform.openai.com/docs)
