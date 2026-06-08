import { Router } from "express";
import {
  analyzeSite,
  getSite,
  getAllSites,
  getNetworkGraph,
} from "../controllers/siteController.js";
import swaggerJsdoc from "swagger-jsdoc";

const siteRoutes = Router();

/**
 * @swagger
 * /api/sites/analyze:
 *   post:
 *     summary: Analyze a website for trackers
 *     description: Launches a headless browser to detect trackers and generates an AI privacy summary.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *     responses:
 *       200:
 *         description: Analysis complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       400:
 *         description: Invalid or missing URL
 *       500:
 *         description: Server error during analysis
 */
siteRoutes.post("/analyze", analyzeSite);

/**
 * @swagger
 * /api/sites/network:
 *   get:
 *     summary: Get network graph data for a site
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Network graph nodes and links
 */
siteRoutes.get("/network", getNetworkGraph);

/**
 * @swagger
 * /api/sites/{url}:
 *   get:
 *     summary: Get stored analysis for a specific URL
 *     parameters:
 *       - in: path
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site data
 */
siteRoutes.get("/:url", getSite);

/**
 * @swagger
 * /api/sites:
 *   get:
 *     summary: List all analyzed sites
 *     responses:
 *       200:
 *         description: Array of sites
 */
siteRoutes.get("/", getAllSites);

export default siteRoutes;
