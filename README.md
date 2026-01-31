# SkillGuard API 🛡️

> x402-powered security auditing for agent skills

SkillGuard is the trust layer for the agent internet. It audits agent skills (skill.md files) for security threats like credential theft, data exfiltration, and malicious commands.

## 🔥 The Problem

From Moltbook's most upvoted discussion:

> "skill.md is an unsigned binary... Rufio scanned 286 ClawdHub skills with YARA rules and found a **credential stealer** disguised as a weather skill"

Agents install skills without verification, exposing them to:
- 🔑 Credential theft
- 📤 Data exfiltration
- 💣 Destructive commands
- 🔓 Privilege escalation

## ✅ The Solution

SkillGuard provides automated security auditing:

```bash
# Agent pays with USDC, gets security report
POST /audit
{
  "skill_url": "https://example.com/skill.md"
}

# Response
{
  "risk_score": 23,
  "risk_level": "LOW",
  "recommendation": "SAFE",
  "findings": {
    "malware": [],
    "credentials": [],
    "network": ["api.weather.com"],
    "permissions": ["http:external"]
  }
}
```

## 💰 Pricing

| Tier | Price | Features |
|------|-------|----------|
| Quick | $0.05 | YARA scan + basic risk score |
| Standard | $0.15 | + permissions + network analysis |
| Deep | $0.50 | + behavioral sandbox + attestation |

Payments via **x402** using USDC on Base.

## 🚀 Quick Start

### For Agents

1. Discover via x402 Bazaar
2. Send skill content or URL
3. Pay with USDC
4. Get security report

### For Developers

```bash
# Clone
git clone https://github.com/eesheng/skillguard-api
cd skillguard-api

# Install
pnpm install

# Configure
cp .env.example .env
# Edit .env with your wallet address

# Run
pnpm dev
```

## 📖 API Reference

### POST /audit
Audit a skill for security threats.

**Request:**
```json
{
  "skill_content": "# My Skill\n...",
  // OR
  "skill_url": "https://example.com/skill.md",
  "tier": "quick" // optional: quick | standard | deep
}
```

**Response:**
```json
{
  "risk_score": 0-100,
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "recommendation": "SAFE | CAUTION | DANGEROUS | BLOCKED",
  "findings": {
    "malware": [...],
    "credentials": [...],
    "network": [...],
    "permissions": [...]
  },
  "audit_id": "...",
  "timestamp": "...",
  "tier": "..."
}
```

### GET /health
Check service status (free).

### GET /pricing
Get tier information (free).

## 🔒 What We Detect

- **Credential Theft** - Reading env vars, SSH keys, API tokens
- **Data Exfiltration** - Sending data to external servers
- **Destructive Commands** - rm -rf, format, dd
- **Privilege Escalation** - sudo, chmod, chown
- **Suspicious Network** - Webhook calls, unknown APIs

## 🏗️ Architecture

```
Client → x402 Payment → Express Router → Audit Engine → Response
                                              │
                        ┌───────────────────────────────────┐
                        │ • Skill Parser                    │
                        │ • YARA Scanner                    │
                        │ • Permission Analyzer             │
                        │ • Network Detector                │
                        │ • Risk Calculator                 │
                        └───────────────────────────────────┘
```

## 📄 License

MIT

## 🙏 Credits

- [x402 Protocol](https://x402.org) - Payment infrastructure
- [Moltbook](https://moltbook.com) - Agent community that identified the problem
- [YARA](https://yara.readthedocs.io) - Pattern matching engine
