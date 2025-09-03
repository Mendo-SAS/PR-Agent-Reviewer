
import * as core from '@actions/core';
import * as github from '@actions/github';
import { OpenAI } from 'openai';

interface ValidationRule {
  name: string;
  description: string;
  pattern?: string;
  required?: boolean;
}

interface PRAnalysisResult {
  approved: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  summary: string;
}

class PRValidator {
  private openai: OpenAI;
  private octokit: ReturnType<typeof github.getOctokit>;
  private systemRules: ValidationRule[];
  private excludePatterns: string[];
  private maxFiles: number;

  constructor() {
    const openaiApiKey = core.getInput('OPENAI_API_KEY');
    const githubToken = core.getInput('GITHUB_TOKEN');
    
    this.openai = new OpenAI({
      apiKey: openaiApiKey
    });
    
    this.octokit = github.getOctokit(githubToken);
    
    // Parse system rules
    try {
      const rulesInput = core.getInput('SYSTEM_RULES');
      this.systemRules = rulesInput ? JSON.parse(rulesInput) : this.getDefaultRules();
    } catch (error) {
      core.warning('Invalid SYSTEM_RULES JSON, using defaults');
      this.systemRules = this.getDefaultRules();
    }
    
    // Parse exclude patterns
    this.excludePatterns = core.getInput('EXCLUDE_PATTERNS').split(',').map((p: string) => p.trim());
    this.maxFiles = parseInt(core.getInput('MAX_FILES')) || 10;
  }

  private getDefaultRules(): ValidationRule[] {
    return [
      {
        name: 'Code Quality',
        description: 'Code should follow best practices and be well-structured',
        required: true
      },
      {
        name: 'Security',
        description: 'No security vulnerabilities or sensitive data exposure',
        required: true
      },
      {
        name: 'Documentation',
        description: 'Complex functions should have proper documentation',
        required: false
      },
      {
        name: 'Testing',
        description: 'New features should include appropriate tests',
        required: false
      },
      {
        name: 'Error Handling',
        description: 'Proper error handling should be implemented',
        required: true
      }
    ];
  }

  private shouldExcludeFile(filename: string): boolean {
    return this.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    });
  }

  async run(): Promise<void> {
    try {
      const { context } = github;
      
      if (context.eventName !== 'pull_request') {
        core.setFailed('This action only works on pull_request events');
        return;
      }

      const pullRequest = context.payload.pull_request;
      if (!pullRequest) {
        core.setFailed('No pull request found in context');
        return;
      }

      core.info(`🤖 Starting AI review for PR #${pullRequest.number}`);

      // Get PR files
      const files = await this.getPRFiles(pullRequest.number);
      const analysisResult = await this.analyzePR(files, pullRequest);
      
      // Post review comment
      await this.postReviewComment(pullRequest.number, analysisResult);
      
      // Set status
      if (analysisResult.approved) {
        core.info('✅ PR approved by AI reviewer');
        await this.setStatus('success', analysisResult.summary);
      } else {
        core.setFailed('❌ PR rejected by AI reviewer');
        await this.setStatus('failure', analysisResult.summary);
      }
      
    } catch (error) {
      core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getPRFiles(prNumber: number) {
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber
    });

    // Filter and limit files
    const validFiles = files
      .filter((file: any) => !this.shouldExcludeFile(file.filename))
      .slice(0, this.maxFiles);

    core.info(`📁 Analyzing ${validFiles.length} files (${files.length} total)`);
    return validFiles;
  }

  private async analyzePR(files: any[], pullRequest: any): Promise<PRAnalysisResult> {
    const model = core.getInput('OPENAI_MODEL') || 'gpt-4';
    
    // Prepare the analysis prompt
    const systemPrompt = this.buildSystemPrompt();
    const prContent = await this.buildPRContent(files, pullRequest);

    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prContent }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAnalysisResult(analysis);
      
    } catch (error) {
      core.error(`OpenAI API error: ${error}`);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    const rulesText = this.systemRules
      .map(rule => `- ${rule.name}: ${rule.description} ${rule.required ? '(REQUIRED)' : '(OPTIONAL)'}`)
      .join('\n');

    return `You are an expert code reviewer. Analyze the provided pull request changes according to these validation rules:

${rulesText}

Your response must be in the following JSON format:
{
  "approved": boolean,
  "score": number (0-100),
  "issues": ["list of critical issues that must be fixed"],
  "suggestions": ["list of optional improvements"],
  "summary": "brief summary of the review"
}

Guidelines:
- Set approved=false if any REQUIRED rule is violated
- Score based on overall code quality (0=poor, 100=excellent)
- List critical issues that prevent approval
- Provide constructive suggestions for improvement
- Keep summary concise but informative`;
  }

  private async buildPRContent(files: any[], pullRequest: any): Promise<string> {
    let content = `## Pull Request Information
Title: ${pullRequest.title}
Description: ${pullRequest.body || 'No description provided'}
Author: ${pullRequest.user.login}
Files Changed: ${files.length}

## Code Changes:\n\n`;

    for (const file of files) {
      content += `### File: ${file.filename}
Status: ${file.status}
Changes: +${file.additions} -${file.deletions}

`;

      // Add patch content if available
      if (file.patch) {
        content += `\`\`\`diff
${file.patch}
\`\`\`

`;
      }
    }

    return content;
  }

  private parseAnalysisResult(analysis: string): PRAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON is not properly formatted
      return {
        approved: !analysis.toLowerCase().includes('rejected') && !analysis.toLowerCase().includes('not approved'),
        score: 75, // Default score
        issues: [],
        suggestions: [],
        summary: analysis.substring(0, 200) + '...'
      };
    } catch (error) {
      core.warning(`Failed to parse analysis result: ${error}`);
      return {
        approved: false,
        score: 0,
        issues: ['Failed to parse AI analysis'],
        suggestions: [],
        summary: 'Analysis parsing failed'
      };
    }
  }

  private async postReviewComment(prNumber: number, result: PRAnalysisResult): Promise<void> {
    const statusEmoji = result.approved ? '✅' : '❌';
    const scoreBar = '█'.repeat(Math.floor(result.score / 10)) + '░'.repeat(10 - Math.floor(result.score / 10));
    
    let comment = `## ${statusEmoji} AI Code Review

**Status:** ${result.approved ? 'APPROVED' : 'CHANGES REQUESTED'}
**Score:** ${result.score}/100 \`${scoreBar}\`

### Summary
${result.summary}
`;

    if (result.issues.length > 0) {
      comment += `
### 🔴 Issues to Fix
${result.issues.map(issue => `- ${issue}`).join('\n')}
`;
    }

    if (result.suggestions.length > 0) {
      comment += `
### 💡 Suggestions
${result.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}
`;
    }

    comment += `
---
*Review generated by AI PR Reviewer powered by ${core.getInput('OPENAI_MODEL') || 'gpt-4'}*`;

    await this.octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      body: comment
    });
  }

  private async setStatus(state: 'success' | 'failure' | 'pending', description: string): Promise<void> {
    await this.octokit.rest.repos.createCommitStatus({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      sha: github.context.payload.pull_request?.head.sha,
      state: state,
      context: 'AI PR Reviewer',
      description: description
    });
  }
}

// Run the action
const validator = new PRValidator();
validator.run().catch(error => {
  core.error(`Unhandled error: ${error}`);
  core.setFailed(error.message);
});
