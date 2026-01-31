/**
 * x402 Payment Middleware
 * 
 * This middleware gates the /audit endpoint behind x402 payments.
 * Supports tiered pricing: quick ($0.05), standard ($0.15), deep ($0.50)
 */

import { paymentMiddleware } from "@x402/express";
import { 
  x402ResourceServer, 
  HTTPFacilitatorClient,
  type ResourceConfig 
} from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarExtension } from "@x402/extensions/bazaar";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";

// Initialize facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: config.X402_FACILITATOR_URL,
});

// Initialize x402 server
const server = new x402ResourceServer(facilitatorClient);

// Register EVM payment scheme
registerExactEvmScheme(server);

// Pricing in USDC atomic units (6 decimals)
// $0.05 = 50000, $0.15 = 150000, $0.50 = 500000
export const TIER_PRICES = {
  quick: 50000n,    // $0.05 USDC
  standard: 150000n, // $0.15 USDC  
  deep: 500000n,     // $0.50 USDC
} as const;

export type AuditTier = keyof typeof TIER_PRICES;

// USDC contract address on Base
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Get USDC address based on network
const getUsdcAddress = () => {
  return config.X402_NETWORK.includes("8453") ? USDC_BASE : USDC_BASE_SEPOLIA;
};

/**
 * Create x402 resource configuration for the audit endpoint
 */
export function createAuditResourceConfig(tier: AuditTier = "quick"): ResourceConfig {
  const price = TIER_PRICES[tier];
  
  return {
    accepts: [
      {
        scheme: "exact",
        network: config.X402_NETWORK,
        maxAmountRequired: price.toString(),
        resource: `${config.BASE_URL}/audit`,
        payTo: config.X402_PAY_TO_ADDRESS,
        asset: getUsdcAddress(),
        extra: {},
      },
    ],
    description: `SkillGuard security audit (${tier} tier)`,
    mimeType: "application/json",
    extensions: {
      bazaar: bazaarExtension({
        discoverable: true,
        category: "security",
        tags: ["audit", "skills", "agents", "trust", "yara", "malware"],
        inputSchema: {
          type: "object",
          properties: {
            skill_url: {
              type: "string",
              description: "URL to fetch skill content from (HTTPS only)",
            },
            skill_content: {
              type: "string",
              description: "Raw skill content to audit",
            },
            tier: {
              type: "string",
              enum: ["quick", "standard", "deep"],
              description: "Audit depth tier",
              default: "quick",
            },
          },
          oneOf: [
            { required: ["skill_url"] },
            { required: ["skill_content"] },
          ],
        },
        outputSchema: {
          type: "object",
          properties: {
            risk_score: { type: "number", minimum: 0, maximum: 100 },
            risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            recommendation: { type: "string", enum: ["SAFE", "CAUTION", "DANGEROUS", "BLOCKED"] },
            findings: { type: "object" },
            audit_id: { type: "string" },
            timestamp: { type: "string" },
            tier: { type: "string" },
          },
          required: ["risk_score", "risk_level", "recommendation", "audit_id"],
        },
      }),
    },
  };
}

/**
 * Dynamic pricing middleware that extracts tier from request
 * and returns appropriate 402 response
 */
export function x402AuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Extract tier from body or query
    const tier = (req.body?.tier || req.query?.tier || "quick") as AuditTier;
    
    // Validate tier
    if (!TIER_PRICES[tier]) {
      return res.status(400).json({
        error: "Invalid tier",
        message: `Tier must be one of: ${Object.keys(TIER_PRICES).join(", ")}`,
      });
    }

    // Get payment header
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // Return 402 with payment requirements
      const resourceConfig = createAuditResourceConfig(tier);
      return res.status(402).json({
        accepts: resourceConfig.accepts,
        description: resourceConfig.description,
        error: "Payment Required",
        pricing: {
          quick: "$0.05 - YARA scan only",
          standard: "$0.15 - YARA + permissions + network analysis",
          deep: "$0.50 - Full analysis + sandbox execution",
        },
      });
    }

    // Verify payment
    try {
      const resourceConfig = createAuditResourceConfig(tier);
      const result = await server.verify(
        paymentHeader,
        resourceConfig.accepts[0]
      );

      if (!result.isValid) {
        return res.status(402).json({
          error: "Payment verification failed",
          accepts: resourceConfig.accepts,
        });
      }

      // Store payment info for settlement after response
      res.locals.x402 = {
        paymentHeader,
        resourceConfig,
        payer: result.payer,
      };

      // Continue to handler
      next();

      // Note: Settlement happens after successful response
      // This is handled by the response finish event
    } catch (error) {
      console.error("x402 verification error:", error);
      return res.status(402).json({
        error: "Payment verification error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Settlement middleware - call after successful response
 */
export async function settlePayment(res: Response): Promise<void> {
  const x402Data = res.locals.x402;
  if (!x402Data) return;

  try {
    await server.settle(
      x402Data.paymentHeader,
      x402Data.resourceConfig.accepts[0]
    );
    console.log(`Payment settled for payer: ${x402Data.payer}`);
  } catch (error) {
    console.error("Settlement error:", error);
    // Log but don't throw - response already sent
  }
}

/**
 * Express middleware factory for x402-protected routes
 */
export function createX402Middleware() {
  return paymentMiddleware(server, {
    "POST /audit": createAuditResourceConfig("quick"),
  });
}
