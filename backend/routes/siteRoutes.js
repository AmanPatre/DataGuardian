import { Router } from "express";
import { analyzeSite, getSite, getAllSites } from "../controllers/siteController.js";


const siteRoutes = Router();


siteRoutes.post("/analyze", analyzeSite);
siteRoutes.get("/:url", getSite);
siteRoutes.get("/", getAllSites);



export default siteRoutes;